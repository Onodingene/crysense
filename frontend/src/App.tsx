// ════════════════════════════════════════════════════════════════
// src/App.tsx
// ════════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react';
import { theme } from './lib/theme';
import { api } from './lib/api';
import { pushManager } from './lib/push';
import { BottomNav, type Tab } from './components/BottomNav';
import { DetectScreen } from './screen/DetectScreen';
import { HistoryScreen } from './screen/HistoryScreen';
import { AlertsScreen } from './screen/AlertsScreen';
import { SettingsScreen } from './screen/SettingsScreen';

export default function App() {
  const [tab, setTab] = useState<Tab>('detect');
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    pushManager.registerServiceWorker().catch(() => {});
    refreshUnread();
  }, []);

  async function refreshUnread() {
    try {
      setUnread(await api.getUnreadCount());
    } catch {
      setUnread(0);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: theme.colors.background,
        display: 'flex',
        justifyContent: 'center',
        fontFamily: theme.fonts.body,
        color: theme.colors.text,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          minHeight: '100vh',
          position: 'relative',
          background: theme.colors.background,
        }}
      >
        {tab === 'detect' && <DetectScreen onDetected={refreshUnread} />}
        {tab === 'history' && <HistoryScreen />}
        {tab === 'alerts' && <AlertsScreen onAlertsRead={refreshUnread} />}
        {tab === 'settings' && <SettingsScreen />}

        <BottomNav active={tab} onChange={setTab} unreadAlerts={unread} />
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        html, body, #root {
          margin: 0;
          padding: 0;
          background: ${theme.colors.background};
          min-height: 100vh;
        }
      `}</style>
    </div>
  );
}