import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2,AlertCircle, Thermometer } from 'lucide-react';
import { theme } from '../lib/theme';
import { api } from '../lib/api';
// import { CLASS_LABEL, CLASS_EMOJI, CLASS_COLOUR } from '../components/shared';
import { TopBar } from '../components/TopBar';

const RECORDING_DURATION_MS = 4000;
type Stage = 'idle' | 'requesting' | 'recording' | 'processing' | 'result' | 'error';

interface DetectionResult {
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
  timestamp: string;
}

export function DetectScreen({ onDetected }: { onDetected: () => void }) {
  const [stage, setStage] = useState<Stage>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [temp, setTemp] = useState<number | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const progRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progRef.current) clearInterval(progRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  const start = async () => {
    setError(null);
    setResult(null);
    setStage('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: 22050 },
      });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = handleStop;
      recorder.start();
      setStage('recording');
      // const startTime = Date.now();
      progRef.current = window.setInterval(() => {
        // setProgress(Math.min(100, ((Date.now() - startTime) / RECORDING_DURATION_MS) * 100));
      }, 50);
      timerRef.current = window.setTimeout(stop, RECORDING_DURATION_MS);
    } catch (err) {
      setStage('error');
      const e = err as Error;
      setError(
        e.name === 'NotAllowedError'
          ? 'Microphone permission denied. Please enable it in your browser settings.'
          : 'Could not access microphone.',
      );
    }
  };

  const stop = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progRef.current) clearInterval(progRef.current);
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
  };

  const handleStop = async () => {
    setStage('processing');
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    if (blob.size < 2000) {
      setStage('error');
      setError('Recording too short. Please try again.');
      return;
    }
    try {
      const fd = new FormData();
      fd.append('audio', blob, 'cry.webm');
      fd.append('timeOfDay', getTimeOfDay());
      // const data = (await api.detect(fd)) as DetectionResult;
      // setResult(data);
      // onDetected();
      // setStage('result');
    } catch (err) {
      setStage('error');
      setError((err as Error).message || 'Could not process the recording.');
    }
  };

  const reset = () => {
    setStage('idle');
    setResult(null);
    setError(null);
    setProgress(0);
  };

  const adjustTemp = async (delta: number) => {
    const newVal = parseFloat(((temp ?? 22) + delta).toFixed(1));
    setTemp(newVal);
    try {
      await api.reportTemperature(newVal);
      onDetected();
    } catch {
      // silent — UI already updated
    }
  };

  return (
    <div style={{ paddingBottom: 90 }}>
      <TopBar title="CrySense" subtitle="Tap to detect what your baby needs" />

      <div style={{ padding: '28px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        <div style={{
          width: '100%', maxWidth: 420, background: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.lg,
          padding: 16, marginBottom: 28, display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 40, height: 40, background: `${theme.colors.info}15`,
            color: theme.colors.info, borderRadius: 999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Thermometer size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 11, color: theme.colors.textMuted, fontWeight: 600,
              letterSpacing: '0.05em', textTransform: 'uppercase',
            }}>
              Room Temperature
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: theme.colors.text, marginTop: 1 }}>
              {temp !== null ? `${temp.toFixed(1)}°C` : '—'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[-0.5, 0.5].map((d) => (
              <button
                key={d}
                onClick={() => adjustTemp(d)}
                style={{
                  width: 32, height: 32, borderRadius: theme.radius.md,
                  background: theme.colors.surfaceAlt,
                  border: `1px solid ${theme.colors.border}`,
                  cursor: 'pointer', fontWeight: 700, color: theme.colors.text,
                }}
              >
                {d > 0 ? '+' : '−'}
              </button>
            ))}
          </div>
        </div>

        {stage === 'idle' && (
          <button onClick={start} style={tapStyle(theme.colors.primary)}>
            <Mic size={56} color="#fff" />
          </button>
        )}
        {stage === 'requesting' && (
          <div style={tapStyle(theme.colors.textMuted)}>
            <Loader2 size={48} color="#fff" className="spin" />
          </div>
        )}
        {stage === 'recording' && (
          <div style={{ position: 'relative' }}>
            <svg width={200} height={200} style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
              <circle cx={100} cy={100} r={92} fill="none"
                stroke={`${theme.colors.primary}20`} strokeWidth={5} />
              <circle cx={100} cy={100} r={92} fill="none"
                stroke={theme.colors.primary} strokeWidth={5} strokeLinecap="round"
                strokeDasharray={`${(progress / 100) * 578} 578`}
                style={{ transition: 'stroke-dasharray 0.05s linear' }} />
            </svg>
            <button onClick={stop} style={tapStyle(theme.colors.danger)}>
              <MicOff size={56} color="#fff" />
            </button>
          </div>
        )}
        {stage === 'processing' && (
          <div style={tapStyle(theme.colors.primary)}>
            <Loader2 size={48} color="#fff" className="spin" />
          </div>
        )}

        {(stage === 'idle' || stage === 'recording' || stage === 'processing') && (
          <p style={{ marginTop: 24, fontSize: 14, color: theme.colors.textMuted, textAlign: 'center' }}>
            {stage === 'idle' && 'Tap when baby is crying'}
            {stage === 'recording' && `Listening… ${Math.round(progress)}%`}
            {stage === 'processing' && 'Analysing the cry…'}
          </p>
        )}

        {stage === 'result' && result && <ResultCard result={result} onReset={reset} />}

        {stage === 'error' && (
          <div style={{
            width: '100%', maxWidth: 420, background: `${theme.colors.danger}08`,
            border: `1px solid ${theme.colors.danger}30`, borderRadius: theme.radius.lg,
            padding: 20, textAlign: 'center', marginTop: 24,
          }}>
            <AlertCircle size={28} color={theme.colors.danger} style={{ marginBottom: 8 }} />
            <p style={{ color: theme.colors.danger, marginBottom: 16, fontSize: 14 }}>{error}</p>
            <button onClick={reset} style={primaryBtn()}>Try again</button>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultCard({ result, onReset }: { result: DetectionResult; onReset: () => void }) {
  // const cause = result.contextAdjustedCause;
  // const colour = CLASS_COLOUR[cause];
  const confPct = Math.round(result.primaryConfidence * 100);

  const sortedProbs: [string, number][] = Object.entries(result.allProbabilities)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div style={{
      width: '100%', maxWidth: 420, marginTop: 24, background: theme.colors.surface,
      border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.lg, overflow: 'hidden',
    }}>
      <div style={{
        // background: `${colour}10`, padding: '24px 24px 20px',
        textAlign: 'center', borderBottom: `1px solid ${theme.colors.borderLight}`,
      }}>
        {/* <div style={{ fontSize: 48, marginBottom: 6 }}>{CLASS_EMOJI[cause]}</div> */}
        {/* <div style={{ fontSize: 20, fontWeight: 700, color: colour }}>{CLASS_LABEL[cause]}</div> */}
        <div style={{ fontSize: 13, color: theme.colors.textMuted, marginTop: 2 }}>
          {confPct}% confidence
        </div>
      </div>

      <div style={{ padding: 20 }}>
        <p style={{ fontSize: 14, lineHeight: 1.5, color: theme.colors.text, marginTop: 0 }}>
          {result.recommendation}
        </p>

        <div style={{ marginTop: 16 }}>
          {result.actionItems.map((item: string, i: number) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0',
              borderTop: i === 0 ? 'none' : `1px solid ${theme.colors.borderLight}`,
            }}>
              {/* <CheckCircle size={16} color={colour} style={{ marginTop: 2, flexShrink: 0 }} /> */}
              <span style={{ fontSize: 13, lineHeight: 1.4, color: theme.colors.text }}>{item}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${theme.colors.borderLight}` }}>
          {sortedProbs.map(([cls, prob]) => (
            <div key={cls} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                {/* <span style={{ color: theme.colors.text, fontWeight: 500 }}>{CLASS_LABEL[cls]}</span> */}
                <span style={{ color: theme.colors.textMuted }}>{Math.round(prob * 100)}%</span>
              </div>
              <div style={{ height: 4, background: theme.colors.surfaceAlt, borderRadius: 2 }}>
                <div style={{
                  height: '100%', width: `${prob * 100}%`,
                  // background: CLASS_COLOUR[cls], borderRadius: 2, transition: 'width 0.4s',
                }} />
              </div>
            </div>
          ))}
        </div>

        {result.fusionApplied && result.fusionReason && (
          <div style={{
            marginTop: 16, padding: 12, background: `${theme.colors.warning}10`,
            border: `1px solid ${theme.colors.warning}30`, borderRadius: theme.radius.md,
            fontSize: 12, lineHeight: 1.5, color: theme.colors.text,
          }}>
            <strong style={{ color: theme.colors.warning }}>Context note: </strong>
            {result.fusionReason}
          </div>
        )}

        <button onClick={onReset} style={{ ...primaryBtn(), marginTop: 20 }}>
          <Mic size={16} /> Detect another cry
        </button>
      </div>
    </div>
  );
}

function tapStyle(colour: string): React.CSSProperties {
  return {
    width: 200, height: 200, borderRadius: '50%', background: colour, border: 'none',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: `0 12px 32px ${colour}40`, transition: 'transform 0.1s',
  };
}

function primaryBtn(): React.CSSProperties {
  return {
    width: '100%', padding: '12px 16px', background: theme.colors.primary, color: '#fff',
    border: 'none', borderRadius: theme.radius.md, fontSize: 14, fontWeight: 600,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  };
}

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h < 6) return 'night';
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  if (h < 21) return 'evening';
  return 'night';
}