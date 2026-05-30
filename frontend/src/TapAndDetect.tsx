// ──────────────────────────────────────────────────────────────────
//  CrySense — Tap & Detect Component (Shazam-style)
// ──────────────────────────────────────────────────────────────────
//
// Flow:
//   1. User taps the big mic button
//   2. Browser records 3–5 seconds of audio via MediaRecorder API
//   3. Audio is auto-uploaded to NestJS backend as multipart blob
//   4. Backend runs ML inference + context fusion
//   5. Result is shown with confidence ring and recommendations
//
// Uses native browser APIs — no extra audio libraries needed
// ──────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

// ── Config ────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';
const RECORDING_DURATION_MS = 4000;   // 4s recording (3s + buffer)
const MIN_AUDIO_BYTES = 2000;

type DetectionResult = {
  id: string;
  primaryCause: string;
  primaryConfidence: number;
  contextAdjustedCause: string;
  fusionApplied: boolean;
  fusionReason?: string;
  recommendation: string;
  actionItems: string[];
  allProbabilities: Record<string, number>;
  modelLatencyMs: number;
  totalLatencyMs: number;
};

type Stage = 'idle' | 'requesting' | 'recording' | 'processing' | 'result' | 'error';

const CLASS_COLOURS: Record<string, string> = {
  hunger:     '#F59E0B',  // amber
  pain:       '#EF4444',  // red
  discomfort: '#8B5CF6',  // violet
  sleepiness: '#3B82F6',  // blue
};

const CLASS_EMOJI: Record<string, string> = {
  hunger: '🍼',
  pain: '🩹',
  discomfort: '😣',
  sleepiness: '😴',
};

// ── Component ────────────────────────────────────────────────────
export default function TapAndDetect() {
  const [stage, setStage] = useState<Stage>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [recordingProgress, setRecordingProgress] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const streamRef        = useRef<MediaStream | null>(null);
  const timerRef         = useRef<number | null>(null);
  const progressRef      = useRef<number | null>(null);

  // Cleanup on unmount
  useEffect(() => () => {
    timerRef.current && window.clearTimeout(timerRef.current);
    progressRef.current && window.clearInterval(progressRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  // ── Step 1: Request mic permission and start recording ─────────
  const startRecording = async () => {
    setError(null);
    setResult(null);
    setStage('requesting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate:   22050,
          echoCancellation: false,  // we want the raw cry
          noiseSuppression: false,
        },
      });
      streamRef.current = stream;

      // Browser support varies — pick best available codec
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : '';

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = handleRecordingStop;

      recorder.start();
      setStage('recording');

      // Progress bar updates every 50ms
      const startTime = Date.now();
      progressRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startTime;
        const pct = Math.min(100, (elapsed / RECORDING_DURATION_MS) * 100);
        setRecordingProgress(pct);
      }, 50);

      // Auto-stop after fixed duration
      timerRef.current = window.setTimeout(() => {
        stopRecording();
      }, RECORDING_DURATION_MS);

    } catch (err: any) {
      setStage('error');
      setError(
        err.name === 'NotAllowedError'
          ? 'Microphone permission denied. Please enable it in your browser settings.'
          : 'Could not access microphone. Make sure your device has one and it works.',
      );
    }
  };

  const stopRecording = () => {
    timerRef.current && window.clearTimeout(timerRef.current);
    progressRef.current && window.clearInterval(progressRef.current);

    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach(t => t.stop());
  };

  // ── Step 2: Recording stopped → upload to backend ──────────────
  const handleRecordingStop = async () => {
    setStage('processing');

    const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });

    if (audioBlob.size < MIN_AUDIO_BYTES) {
      setStage('error');
      setError('Recording too short. Please try again.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'cry.webm');

      // Add context — these can come from your app's state/profile
      const lastFed   = localStorage.getItem('lastFedAt');
      const lastSlept = localStorage.getItem('lastSleptAt');
      if (lastFed)   formData.append('lastFedAt',   lastFed);
      if (lastSlept) formData.append('lastSleptAt', lastSlept);
      formData.append('timeOfDay', getTimeOfDay());

      const response = await fetch(`${API_BASE}/api/detect`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `Server returned ${response.status}`);
      }

      const data: DetectionResult = await response.json();
      setResult(data);
      setStage('result');

    } catch (err: any) {
      setStage('error');
      setError(err.message || 'Could not process the recording. Please try again.');
    }
  };

  const reset = () => {
    setStage('idle');
    setResult(null);
    setError(null);
    setRecordingProgress(0);
  };

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      fontFamily: "'Inter', system-ui, sans-serif",
      color: '#F1F5F9',
    }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, marginBottom: 6 }}>
          CrySense
        </h1>
        <p style={{ fontSize: 14, opacity: 0.6, margin: 0 }}>
          Tap to detect what your baby needs
        </p>
      </div>

      {/* ── IDLE — Big tap button ─────────────────────────────── */}
      {stage === 'idle' && (
        <button
          onClick={startRecording}
          style={tapButtonStyle('#F5C518')}
        >
          <Mic size={64} color="#0F172A" />
        </button>
      )}

      {/* ── REQUESTING ────────────────────────────────────────── */}
      {stage === 'requesting' && (
        <div style={tapButtonStyle('#64748B')}>
          <Loader2 size={48} color="#F1F5F9" className="spin" />
        </div>
      )}

      {/* ── RECORDING with progress ring ──────────────────────── */}
      {stage === 'recording' && (
        <div style={{ position: 'relative' }}>
          <svg width={220} height={220} style={{
            position: 'absolute', top: 0, left: 0,
            transform: 'rotate(-90deg)',
          }}>
            <circle cx={110} cy={110} r={100} fill="none"
                    stroke="rgba(245,197,24,0.15)" strokeWidth={6} />
            <circle cx={110} cy={110} r={100} fill="none"
                    stroke="#F5C518" strokeWidth={6} strokeLinecap="round"
                    strokeDasharray={`${(recordingProgress / 100) * 628} 628`}
                    style={{ transition: 'stroke-dasharray 0.05s linear' }} />
          </svg>
          <button onClick={stopRecording} style={tapButtonStyle('#EF4444')}>
            <MicOff size={64} color="#FFF" />
          </button>
        </div>
      )}

      {/* ── PROCESSING ────────────────────────────────────────── */}
      {stage === 'processing' && (
        <div style={tapButtonStyle('#3B82F6')}>
          <Loader2 size={48} color="#FFF" className="spin" />
        </div>
      )}

      {/* ── RESULT ────────────────────────────────────────────── */}
      {stage === 'result' && result && (
        <ResultCard result={result} onReset={reset} />
      )}

      {/* ── ERROR ─────────────────────────────────────────────── */}
      {stage === 'error' && (
        <div style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 12,
          padding: 24,
          maxWidth: 400,
          textAlign: 'center',
        }}>
          <AlertCircle size={32} color="#EF4444" style={{ marginBottom: 12 }} />
          <p style={{ color: '#FCA5A5', marginBottom: 16 }}>{error}</p>
          <button onClick={reset} style={resetButtonStyle()}>
            Try again
          </button>
        </div>
      )}

      {/* Status message under button */}
      {(stage === 'idle' || stage === 'recording' || stage === 'processing') && (
        <p style={{ marginTop: 32, fontSize: 14, opacity: 0.7, textAlign: 'center' }}>
          {stage === 'idle' && 'Tap when baby is crying'}
          {stage === 'recording' && `Listening… ${Math.round(recordingProgress)}%`}
          {stage === 'processing' && 'Analysing the cry…'}
        </p>
      )}

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}


// ──────────────────────────────────────────────────────────────────
//  Result card
// ──────────────────────────────────────────────────────────────────
function ResultCard({ result, onReset }: { result: DetectionResult; onReset: () => void }) {
  const cause   = result.contextAdjustedCause;
  const colour  = CLASS_COLOURS[cause];
  const confPct = Math.round(result.primaryConfidence * 100);

  return (
    <div style={{
      width: '100%',
      maxWidth: 480,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      padding: 28,
    }}>
      {/* Main result */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 56, marginBottom: 8 }}>{CLASS_EMOJI[cause]}</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: colour, textTransform: 'capitalize' }}>
          {cause}
        </div>
        <div style={{ fontSize: 13, opacity: 0.6, marginTop: 4 }}>
          {confPct}% confidence
        </div>
      </div>

      {/* Recommendation */}
      <p style={{ fontSize: 15, lineHeight: 1.5, marginBottom: 16 }}>
        {result.recommendation}
      </p>

      {/* Action items */}
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ fontSize: 12, textTransform: 'uppercase', opacity: 0.6,
                     letterSpacing: '0.05em', marginBottom: 10 }}>
          Try this
        </h4>
        {result.actionItems.map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}>
            <CheckCircle size={16} color={colour} style={{ marginTop: 2, flexShrink: 0 }} />
            <span style={{ fontSize: 14, lineHeight: 1.4 }}>{item}</span>
          </div>
        ))}
      </div>

      {/* All probabilities bar chart */}
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ fontSize: 12, textTransform: 'uppercase', opacity: 0.6,
                     letterSpacing: '0.05em', marginBottom: 10 }}>
          All probabilities
        </h4>
        {Object.entries(result.allProbabilities)
          .sort(([, a], [, b]) => b - a)
          .map(([cls, prob]) => (
            <div key={cls} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between',
                            fontSize: 12, marginBottom: 4 }}>
                <span style={{ textTransform: 'capitalize' }}>{cls}</span>
                <span style={{ opacity: 0.6 }}>{Math.round(prob * 100)}%</span>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.08)',
                            borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${prob * 100}%`,
                  background: CLASS_COLOURS[cls],
                  borderRadius: 2,
                  transition: 'width 0.4s ease',
                }} />
              </div>
            </div>
          ))}
      </div>

      {/* Fusion note */}
      {result.fusionApplied && result.fusionReason && (
        <div style={{
          fontSize: 12, padding: 12,
          background: 'rgba(245,197,24,0.08)',
          border: '1px solid rgba(245,197,24,0.2)',
          borderRadius: 8, marginBottom: 16, lineHeight: 1.5,
        }}>
          <strong style={{ color: '#F5C518' }}>Context note: </strong>
          {result.fusionReason}
        </div>
      )}

      {/* Try again */}
      <button onClick={onReset} style={resetButtonStyle()}>
        <Mic size={16} /> Detect another cry
      </button>

      <div style={{ fontSize: 10, opacity: 0.4, marginTop: 12, textAlign: 'center' }}>
        Analysed in {result.totalLatencyMs}ms
      </div>
    </div>
  );
}


// ── Helpers / styles ─────────────────────────────────────────────
function tapButtonStyle(colour: string): React.CSSProperties {
  return {
    width: 220, height: 220, borderRadius: '50%',
    background: colour, border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: `0 12px 40px ${colour}40, 0 0 0 8px ${colour}10`,
    transition: 'transform 0.15s, box-shadow 0.15s',
  };
}

function resetButtonStyle(): React.CSSProperties {
  return {
    width: '100%', padding: '12px 16px',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 8, color: '#F1F5F9', fontSize: 14, fontWeight: 600,
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  };
}

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h < 6)  return 'night';
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  if (h < 21) return 'evening';
  return 'night';
}
