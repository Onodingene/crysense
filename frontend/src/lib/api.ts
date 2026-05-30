const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';
 
export const api = {
  // ── History ────────────────────────────────────────────────────
  async getHistory() {
    const res = await fetch(`${API_BASE}/api/history`);
    if (!res.ok) throw new Error('Failed to load history');
    return res.json();
  },
  async clearHistory() {
    await fetch(`${API_BASE}/api/history`, { method: 'DELETE' });
  },
 
  // ── Alerts ─────────────────────────────────────────────────────
  async getAlerts() {
    const res = await fetch(`${API_BASE}/api/alerts`);
    if (!res.ok) throw new Error('Failed to load alerts');
    return res.json();
  },
  async getUnreadCount(): Promise<number> {
    const res = await fetch(`${API_BASE}/api/alerts/unread-count`);
    if (!res.ok) return 0;
    return (await res.json()).count;
  },
  async markAlertRead(id: string) {
    await fetch(`${API_BASE}/api/alerts/${id}/read`, { method: 'POST' });
  },
  async markAllAlertsRead() {
    await fetch(`${API_BASE}/api/alerts/read-all`, { method: 'POST' });
  },
  async clearAlerts() {
    await fetch(`${API_BASE}/api/alerts`, { method: 'DELETE' });
  },
 
  // ── Settings ───────────────────────────────────────────────────
  async getSettings() {
    const res = await fetch(`${API_BASE}/api/settings`);
    if (!res.ok) throw new Error('Failed to load settings');
    return res.json();
  },
  async updateSettings(patch: unknown) {
    const res = await fetch(`${API_BASE}/api/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    return res.json();
  },
 
  // ── Temperature ────────────────────────────────────────────────
  async reportTemperature(value: number) {
    await fetch(`${API_BASE}/api/detect/temperature`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
  },
 
  // ── Push ───────────────────────────────────────────────────────
  async getPushPublicKey(): Promise<string> {
    const res = await fetch(`${API_BASE}/api/push/public-key`);
    return (await res.json()).publicKey;
  },
  async subscribePush(subscription: PushSubscription) {
    await fetch(`${API_BASE}/api/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    });
  },
  async unsubscribePush(endpoint: string) {
    await fetch(`${API_BASE}/api/push/unsubscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint }),
    });
  },
};
 
 