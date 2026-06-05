import { Bell, Thermometer, AlertCircle, CheckCheck, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { TopBar } from '../components/TopBar';
import { theme } from '../lib/theme';

interface Alert {
  id: string;
  type: 'cry' | 'temperature';
  severity: 'info' | 'warning' | 'danger';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  relatedId?: string;
}

type EmptyStateProps = {
  emoji: string;
  title: string;
  subtitle: string;
};

function EmptyState({ emoji, title, subtitle }: EmptyStateProps) {
  return (
    <div style={{ padding: 20, textAlign: 'center', color: theme.colors.textMuted }}>
      <div style={{ fontSize: 48, lineHeight: 1 }}>{emoji}</div>
      <div style={{ marginTop: 12, fontSize: 16, fontWeight: 600 }}>{title}</div>
      <div style={{ marginTop: 6, fontSize: 13 }}>{subtitle}</div>
    </div>
  );
}

function iconButtonStyle(): React.CSSProperties {
  return {
    width: 32,
    height: 32,
    borderRadius: theme.radius.md,
    background: 'transparent',
    border: `1px solid ${theme.colors.border}`,
    color: theme.colors.text,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
}

function formatRelative(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export function AlertsScreen({ onAlertsRead }: { onAlertsRead: () => void }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const loadAlerts = async () => {
    try {
      const data = (await api.getAlerts()) as Alert[];
      setAlerts(data);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAlerts();
  }, []);

  const markAllRead = async () => {
    try {
      await api.markAllAlertsRead();
      await loadAlerts();
      onAlertsRead();
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const clearAll = async () => {
    if (!confirm('Clear all alerts?')) return;
    try {
      await api.clearAlerts();
      setAlerts([]);
      onAlertsRead();
    } catch (err) {
      console.error('Failed to clear alerts:', err);
    }
  };

  const handleAlertClick = async (alertId: string) => {
    try {
      await api.markAlertRead(alertId);
      await loadAlerts();
      onAlertsRead();
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const unread = alerts.filter((a) => !a.read).length;

  return (
    <div style={{ paddingBottom: 90 }}>
      <TopBar
        title="Alerts"
        subtitle={unread === 0 ? 'All caught up' : `${unread} unread`}
        action={
          alerts.length > 0 ? (
            <div style={{ display: 'flex', gap: 4 }}>
              {unread > 0 && (
                <button onClick={markAllRead} style={iconButtonStyle()}>
                  <CheckCheck size={18} />
                </button>
              )}
              <button onClick={clearAll} style={iconButtonStyle()}>
                <Trash2 size={18} />
              </button>
            </div>
          ) : null
        }
      />

      {alerts.length === 0 ? (
        <EmptyState emoji="🔔" title="No alerts" subtitle="You're all caught up" />
      ) : (
        <div style={{ padding: '12px 20px' }}>
          {alerts.map((alert) => {
            const Icon =
              alert.type === 'cry'
                ? Bell
                : alert.type === 'temperature'
                ? Thermometer
                : AlertCircle;
            const colour =
              alert.severity === 'danger'
                ? theme.colors.danger
                : alert.severity === 'warning'
                ? theme.colors.warning
                : theme.colors.info;

            return (
              <div
                key={alert.id}
                onClick={() => handleAlertClick(alert.id)}
                style={{
                  background: theme.colors.surface,
                  border: `1px solid ${alert.read ? theme.colors.border : `${colour}30`}`,
                  borderRadius: theme.radius.lg,
                  padding: 14,
                  marginBottom: 8,
                  display: 'flex',
                  gap: 12,
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                {!alert.read && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: colour,
                    }}
                  />
                )}
                <div
                  style={{
                    width: 40,
                    height: 40,
                    background: `${colour}15`,
                    color: colour,
                    borderRadius: theme.radius.full,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: alert.read ? 500 : 700,
                      color: theme.colors.text,
                    }}
                  >
                    {alert.title}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: theme.colors.textMuted,
                      marginTop: 2,
                      lineHeight: 1.4,
                    }}
                  >
                    {alert.message}
                  </div>
                  <div style={{ fontSize: 11, color: theme.colors.textLight, marginTop: 6 }}>
                    {formatRelative(alert.createdAt)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

