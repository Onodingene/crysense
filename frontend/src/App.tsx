// ════════════════════════════════════════════════════════════════
// src/App.tsx
// ════════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react';
import { theme } from './lib/theme';
import { api } from './lib/api';
import { pushManager } from './lib/push';
import { BottomNav, type Tab } from './components/BottomNav';
import { DetectScreen } from './screen/DetectScreen';
// import { HistoryScreen } from './screen/HistoryScreen';
import { AlertsScreen } from './screen/AlertsScreen';
import { SettingsScreen } from './screen/SettingsScreen';

export default function App() {
  const [tab, setTab] = useState<Tab>('detect');
  const [unread, setUnread] = useState(0);

  // Register the service worker once on app start (needed for push)
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
    <div style={{
      minHeight: '100vh',
      background: theme.colors.background,
      fontFamily: theme.fonts.body,
      color: theme.colors.text,
      maxWidth: 480,
      margin: '0 auto',
      position: 'relative',
    }}>
      {tab === 'detect'   && <DetectScreen onDetected={refreshUnread} />}
      {tab === 'alerts'   && <AlertsScreen onAlertsRead={refreshUnread} />}
      {tab === 'settings' && <SettingsScreen />}

      <BottomNav active={tab} onChange={setTab} unreadAlerts={unread} />

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        body { margin: 0; }
      `}</style>
    </div>
  );
}