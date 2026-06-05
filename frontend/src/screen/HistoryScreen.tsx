import { useState, useEffect } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { theme } from '../lib/theme';
import { api } from '../lib/api';
import { TopBar } from '../components/TopBar';

const CLASS_LABEL: Record<string, string> = {
  hunger: 'Hunger',
  pain: 'Pain',
  discomfort: 'Discomfort',
  sleepiness: 'Sleepiness',
};

const CLASS_EMOJI: Record<string, string> = {
  hunger: '🍼',
  pain: '🩹',
  discomfort: '😣',
  sleepiness: '😴',
};

const CLASS_COLOUR: Record<string, string> = {
  hunger: '#F59E0B',
  pain: '#EF4444',
  discomfort: '#8B5CF6',
  sleepiness: '#3B82F6',
};

interface HistoryEntry {
  id: string;
  primaryCause: string;
  primaryConfidence: number;
  contextAdjustedCause: string;
  fusionApplied: boolean;
  fusionReason?: string;
  recommendation: string;
  actionItems: string[];
  allProbabilities: Record<string, number>;
  timestamp: string;
}

type EmptyStateProps = { emoji: string; title: string; subtitle: string };

function EmptyState({ emoji, title, subtitle }: EmptyStateProps) {
  return (
    <div style={{ padding: 40, textAlign: 'center', color: theme.colors.textMuted }}>
      <div style={{ fontSize: 48, lineHeight: 1 }}>{emoji}</div>
      <div style={{ marginTop: 12, fontSize: 16, fontWeight: 600 }}>{title}</div>
      <div style={{ marginTop: 6, fontSize: 13 }}>{subtitle}</div>
    </div>
  );
}

function formatTime(ts: string): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function groupByDate(history: HistoryEntry[]): Record<string, HistoryEntry[]> {
  const groups: Record<string, HistoryEntry[]> = {};
  for (const entry of history) {
    const d = new Date(entry.timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    let label: string;
    if (d.toDateString() === today.toDateString()) label = 'Today';
    else if (d.toDateString() === yesterday.toDateString()) label = 'Yesterday';
    else label = d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });

    if (!groups[label]) groups[label] = [];
    groups[label].push(entry);
  }
  return groups;
}

export function HistoryScreen() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<HistoryEntry | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = (await api.getHistory()) as HistoryEntry[];
      setHistory(data);
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleClear() {
    if (!confirm('Clear all history?')) return;
    try {
      await api.clearHistory();
      setHistory([]);
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  }

  const grouped = groupByDate(history);

  return (
    <div style={{ paddingBottom: 90 }}>
      <TopBar
        title="History"
        subtitle={`${history.length} cr${history.length === 1 ? 'y' : 'ies'} detected`}
        action={
          history.length > 0 ? (
            <button
              onClick={handleClear}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: theme.colors.textMuted,
                padding: 8,
              }}
            >
              <Trash2 size={18} />
            </button>
          ) : null
        }
      />

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center' }}>
          <Loader2 size={28} className="spin" color={theme.colors.textMuted} />
        </div>
      ) : history.length === 0 ? (
        <EmptyState emoji="🕊️" title="No detections yet" subtitle="Tap the mic on the Detect screen to start" />
      ) : (
        <div style={{ padding: '16px 20px' }}>
          {Object.entries(grouped).map(([day, entries]) => (
            <div key={day} style={{ marginBottom: 28 }}>
              <h3
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: theme.colors.textMuted,
                  margin: '0 0 12px',
                }}
              >
                {day}
              </h3>
              {entries.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => setSelected(entry)}
                  style={{
                    width: '100%',
                    background: theme.colors.surface,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.radius.lg,
                    padding: 14,
                    marginBottom: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      background: `${CLASS_COLOUR[entry.contextAdjustedCause] || theme.colors.primary}15`,
                      borderRadius: 999,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22,
                      flexShrink: 0,
                    }}
                  >
                    {CLASS_EMOJI[entry.contextAdjustedCause] || '👶'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: theme.colors.text }}>
                      {CLASS_LABEL[entry.contextAdjustedCause] || entry.contextAdjustedCause}
                    </div>
                    <div style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 2 }}>
                      {formatTime(entry.timestamp)} · {Math.round(entry.primaryConfidence * 100)}% confidence
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {selected && <DetailModal entry={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function DetailModal({ entry, onClose }: { entry: HistoryEntry; onClose: () => void }) {
  const cause = entry.contextAdjustedCause;
  const colour = CLASS_COLOUR[cause] || theme.colors.primary;

  const subhead: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: theme.colors.textMuted,
    margin: '0 0 8px',
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 200,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: theme.colors.surface,
          width: '100%',
          maxWidth: 480,
          borderRadius: '20px 20px 0 0',
          padding: '24px 20px',
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            width: 36,
            height: 4,
            background: theme.colors.border,
            borderRadius: 2,
            margin: '0 auto 16px',
          }}
        />
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 56, marginBottom: 4 }}>{CLASS_EMOJI[cause] || '👶'}</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: colour }}>
            {CLASS_LABEL[cause] || cause}
          </div>
          <div style={{ fontSize: 13, color: theme.colors.textMuted, marginTop: 4 }}>
            {new Date(entry.timestamp).toLocaleString()}
          </div>
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.5, color: theme.colors.text }}>{entry.recommendation}</p>

        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${theme.colors.borderLight}` }}>
          <h4 style={subhead}>Action items</h4>
          {entry.actionItems.map((item, i) => (
            <div key={i} style={{ padding: '6px 0', fontSize: 13, color: theme.colors.text }}>
              • {item}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${theme.colors.borderLight}` }}>
          <h4 style={subhead}>All probabilities</h4>
          {Object.entries(entry.allProbabilities)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .map(([cls, prob]) => (
              <div key={cls} style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                  <span>{CLASS_LABEL[cls] || cls}</span>
                  <span style={{ color: theme.colors.textMuted }}>{Math.round((prob as number) * 100)}%</span>
                </div>
                <div style={{ height: 4, background: theme.colors.surfaceAlt, borderRadius: 2 }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${(prob as number) * 100}%`,
                      background: CLASS_COLOUR[cls] || theme.colors.primary,
                      borderRadius: 2,
                    }}
                  />
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}