"""
CrySense Model Microservice — ONNX Runtime version
====================================================
Uses ONNX runtime for inference and ffmpeg (via subprocess) for audio decoding.
Works with browser-recorded WebM/Opus audio on Windows, Mac, and Linux.

Run with:
    python -m uvicorn main:app --reload --port 8000
"""

import os
import io
import time
import logging
import subprocess
from typing import Dict
from contextlib import asynccontextmanager

# Make ffmpeg binary available on PATH
import imageio_ffmpeg
os.environ["PATH"] = (
    os.path.dirname(imageio_ffmpeg.get_ffmpeg_exe())
    + os.pathsep
    + os.environ["PATH"]
)

import numpy as np
import librosa
import noisereduce as nr
import onnxruntime as ort
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


# ── Logging ────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger("crysense")


# ── Config ─────────────────────────────────────────────────────────
MODEL_PATH    = os.getenv("MODEL_PATH",    "./models/crysense_model.onnx")
NORM_PATH     = os.getenv("NORM_PATH",     "./models/normalisation.npz")
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "*").split(",")

SR         = 22050
DURATION   = 3
N_MFCC     = 40
N_FFT      = 2048
HOP_LENGTH = 512
CLASSES    = ["hunger", "pain", "discomfort", "sleepiness"]
TARGET_LEN = SR * DURATION


# ── Global store ───────────────────────────────────────────────────
class ModelStore:
    session = None
    input_name = None
    output_name = None
    mean  = None
    std   = None
    ready = False


store = ModelStore()


# ── Lifespan: load model once at startup ───────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Loading ONNX model from %s", MODEL_PATH)
    store.session = ort.InferenceSession(
        MODEL_PATH,
        providers=["CPUExecutionProvider"],
    )
    store.input_name  = store.session.get_inputs()[0].name
    store.output_name = store.session.get_outputs()[0].name

    log.info("Loading normalisation stats from %s", NORM_PATH)
    npz = np.load(NORM_PATH)
    store.mean = float(npz["mean"])
    store.std  = float(npz["std"])

    log.info("Warming up model...")
    input_shape = store.session.get_inputs()[0].shape
    dummy_shape = tuple(d if isinstance(d, int) else 1 for d in input_shape)
    dummy = np.zeros(dummy_shape, dtype=np.float32)
    _ = store.session.run([store.output_name], {store.input_name: dummy})

    store.ready = True
    log.info("Model service ready — input: %s shape %s", store.input_name, input_shape)
    yield
    log.info("Shutting down")


# ── App ────────────────────────────────────────────────────────────
app = FastAPI(
    title="CrySense Model API (ONNX)",
    description="AI microservice for infant cry classification",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_HOSTS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# ── Schemas ────────────────────────────────────────────────────────
class PredictionResponse(BaseModel):
    predicted_class: str
    confidence: float
    all_probabilities: Dict[str, float]
    processing_time_ms: float
    audio_duration_s: float


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    classes: list


# ── Audio decoding (ffmpeg subprocess, works for any browser format)
def load_audio_from_bytes(audio_bytes: bytes) -> np.ndarray:
    log.info(
        f"Received audio: {len(audio_bytes)} bytes, "
        f"first 8 bytes: {audio_bytes[:8].hex()}"
    )

    ffmpeg_path = imageio_ffmpeg.get_ffmpeg_exe()

    try:
        process = subprocess.run(
            [
                ffmpeg_path,
                "-loglevel", "error",
                "-i", "pipe:0",
                "-f", "f32le",
                "-acodec", "pcm_f32le",
                "-ac", "1",
                "-ar", str(SR),
                "pipe:1",
            ],
            input=audio_bytes,
            capture_output=True,
            timeout=10,
        )

        if process.returncode != 0:
            err = process.stderr.decode(errors="ignore")
            log.error(f"ffmpeg failed: {err}")
            raise HTTPException(status_code=400, detail=f"ffmpeg decode error: {err[:200]}")

        samples = np.frombuffer(process.stdout, dtype=np.float32).copy()
        log.info(f"Decoded audio: {len(samples)} samples at {SR}Hz")

        if len(samples) == 0:
            raise HTTPException(status_code=400, detail="ffmpeg produced no audio")

        return samples

    except subprocess.TimeoutExpired:
        log.error("ffmpeg timed out")
        raise HTTPException(status_code=400, detail="Audio decoding timed out")
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Audio decode failed: {type(e).__name__}: {e}")
        raise HTTPException(status_code=400, detail=f"Cannot decode audio: {e}")


# ── Feature extraction ─────────────────────────────────────────────
def preprocess(y: np.ndarray) -> np.ndarray:
    y = nr.reduce_noise(y=y, sr=SR)
    y, _ = librosa.effects.trim(y, top_db=20)
    if np.max(np.abs(y)) > 0:
        y = y / np.max(np.abs(y))
    y = np.pad(y, (0, max(0, TARGET_LEN - len(y))))[:TARGET_LEN]
    return y.astype(np.float32)




def extract_features(y: np.ndarray) -> np.ndarray:
    """Rich feature stack matching the trained model:
       MFCC(40) + Δ(40) + ΔΔ(40) + Mel(64) + Chroma(12) + Contrast(7) = 203
    """
    # Timbral features
    mfcc   = librosa.feature.mfcc(y=y, sr=SR, n_mfcc=N_MFCC,
                                   n_fft=N_FFT, hop_length=HOP_LENGTH)
    delta  = librosa.feature.delta(mfcc)
    delta2 = librosa.feature.delta(mfcc, order=2)

    # Spectral envelope
    mel    = librosa.feature.melspectrogram(y=y, sr=SR, n_mels=64,
                                             n_fft=N_FFT, hop_length=HOP_LENGTH)
    mel_db = librosa.power_to_db(mel, ref=np.max)

    # Pitch class
    chroma = librosa.feature.chroma_stft(y=y, sr=SR,
                                          n_fft=N_FFT, hop_length=HOP_LENGTH)

    # Spectral peaks/valleys
    contrast = librosa.feature.spectral_contrast(y=y, sr=SR,
                                                  n_fft=N_FFT, hop_length=HOP_LENGTH)

    features = np.vstack([mfcc, delta, delta2, mel_db, chroma, contrast])
    return features.astype(np.float32)

def predict(audio_bytes: bytes) -> dict:
    t0 = time.time()

    y = load_audio_from_bytes(audio_bytes)
    duration_s = float(len(y)) / SR

    y_clean = preprocess(y)
    feat    = extract_features(y_clean)
    feat_n  = (feat - store.mean) / store.std
    x_in    = feat_n.T[np.newaxis, ...].astype(np.float32)

    probs    = store.session.run([store.output_name], {store.input_name: x_in})[0][0]
    pred_idx = int(np.argmax(probs))

    return {
        "predicted_class": CLASSES[pred_idx],
        "confidence": float(probs[pred_idx]),
        "all_probabilities": {cls: float(probs[i]) for i, cls in enumerate(CLASSES)},
        "processing_time_ms": (time.time() - t0) * 1000,
        "audio_duration_s": duration_s,
    }


# ── Routes ─────────────────────────────────────────────────────────
@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(
        status="healthy" if store.ready else "loading",
        model_loaded=store.ready,
        classes=CLASSES,
    )


@app.post("/predict", response_model=PredictionResponse)
async def predict_endpoint(
    audio: UploadFile = File(..., description="Audio file (.wav, .webm, .mp3, .ogg)"),
):
    if not store.ready:
        raise HTTPException(status_code=503, detail="Model not loaded yet")

    if audio.size and audio.size > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Audio file too large (max 5MB)")

    audio_bytes = await audio.read()
    log.info(
        f"Endpoint received: filename={audio.filename}, "
        f"content_type={audio.content_type}, size={len(audio_bytes)} bytes"
    )

    if len(audio_bytes) < 1000:
        log.warning(f"Audio file too short: only {len(audio_bytes)} bytes")
        raise HTTPException(status_code=400, detail="Audio file too short")

    try:
        result = predict(audio_bytes)
        log.info(
            "Prediction: %s (%.2f) in %.0fms",
            result["predicted_class"],
            result["confidence"],
            result["processing_time_ms"],
        )
        return PredictionResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        log.exception("Prediction failed")
        raise HTTPException(status_code=500, detail=f"Prediction error: {e}")


@app.get("/")
async def root():
    return {
        "service": "CrySense Model API",
        "status": "ok",
        "backend": "onnxruntime",
        "endpoints": ["/health", "/predict", "/docs"],
    }