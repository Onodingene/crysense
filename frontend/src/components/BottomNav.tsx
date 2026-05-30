import { Mic, Clock, Bell, Settings, type LucideIcon } from 'lucide-react';
import { theme } from '../lib/theme';
 
export type Tab = 'detect' | 'history' | 'alerts' | 'settings';
 
interface BottomNavProps {
  active: Tab;
  onChange: (t: Tab) => void;
  unreadAlerts: number;
}
 
export function BottomNav({ active, onChange, unreadAlerts }: BottomNavProps) {
  const items: { id: Tab; label: string; icon: LucideIcon }[] = [
    { id: 'detect',   label: 'Detect',   icon: Mic },
    { id: 'history',  label: 'History',  icon: Clock },
    { id: 'alerts',   label: 'Alerts',   icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];
 
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: theme.colors.surface,
      borderTop: `1px solid ${theme.colors.border}`,
      paddingBottom: 'env(safe-area-inset-bottom, 8px)',
      paddingTop: 8,
      display: 'flex',
      justifyContent: 'space-around',
      zIndex: 100,
    }}>
      {items.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '8px 4px',
              position: 'relative',
              color: isActive ? theme.colors.primary : theme.colors.textMuted,
              transition: 'color 0.15s',
            }}
          >
            <div style={{ position: 'relative' }}>
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              {id === 'alerts' && unreadAlerts > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -8,
                  background: theme.colors.primary,
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                  borderRadius: 10,
                  padding: '1px 5px',
                  minWidth: 16,
                  textAlign: 'center',
                  lineHeight: 1.4,
                }}>
                  {unreadAlerts > 9 ? '9+' : unreadAlerts}
                </span>
              )}
            </div>
            <span style={{ fontSize: 11, fontWeight: isActive ? 600 : 500 }}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
 