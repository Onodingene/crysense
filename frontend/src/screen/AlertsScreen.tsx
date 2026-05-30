import { Bell, Thermometer, AlertCircle, CheckCheck, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Alert } from '../lib/type';
import { storage } from '../lib/storage';
import { TopBar } from '../components/TopBar';
import { theme } from '../lib/theme';
 
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
 
export function AlertsScreen({ onAlertsRead }: { onAlertsRead: () => void }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
 
  useEffect(() => {
    setAlerts(storage.getAlerts());
  }, []);
 
  const markAllRead = () => {
    alerts.forEach(a => storage.markAlertRead(a.id));
    setAlerts(storage.getAlerts());
    onAlertsRead();
  };
 
  const clearAll = () => {
    if (!confirm('Clear all alerts?')) return;
    storage.clearAlerts();
    setAlerts([]);
    onAlertsRead();
  };
 
  const unread = alerts.filter(a => !a.read).length;
 
  function iconButtonStyle(): import("react").CSSProperties | undefined {
    throw new Error('Function not implemented.');
  }

  return (
    <div style={{ paddingBottom: 90 }}>
      <TopBar
        title="Alerts"
        subtitle={unread === 0 ? 'All caught up' : `${unread} unread`}
        action={alerts.length > 0 && (
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
        )}
      />
 
      {alerts.length === 0 ? (
        <EmptyState emoji="🔔" title="No alerts" subtitle="You're all caught up" />
      ) : (
        <div style={{ padding: '12px 20px' }}>
          {alerts.map(alert => {
            const Icon =
              alert.type === 'cry'         ? Bell :
              alert.type === 'temperature' ? Thermometer :
              AlertCircle;
            const colour =
              alert.severity === 'danger'  ? theme.colors.danger :
              alert.severity === 'warning' ? theme.colors.warning :
              theme.colors.info;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            function formatRelative(_timestamp: string): import("react").ReactNode {
              throw new Error('Function not implemented.');
            }

            return (
              <div key={alert.id} onClick={() => {
                storage.markAlertRead(alert.id);
                setAlerts(storage.getAlerts());
                onAlertsRead();
              }} style={{
                background: theme.colors.surface,
                border: `1px solid ${alert.read ? theme.colors.border : `${colour}30`}`,
                borderRadius: theme.radius.lg,
                padding: 14,
                marginBottom: 8,
                display: 'flex',
                gap: 12,
                cursor: 'pointer',
                position: 'relative',
              }}>
                {!alert.read && (
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    width: 8, height: 8, borderRadius: '50%',
                    background: colour,
                  }} />
                )}
                <div style={{
                  width: 40, height: 40,
                  background: `${colour}15`,
                  color: colour,
                  borderRadius: theme.radius.full,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14,
                    fontWeight: alert.read ? 500 : 700,
                    color: theme.colors.text,
                  }}>
                    {alert.title}
                  </div>
                  <div style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 2, lineHeight: 1.4 }}>
                    {alert.message}
                  </div>
                  <div style={{ fontSize: 11, color: theme.colors.textLight, marginTop: 6 }}>
                    {formatRelative(alert.timestamp)}
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
 
 