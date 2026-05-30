import type { HistoryEntry, Alert, AppSettings, TemperatureReading } from './types';
 
const KEYS = {
  history: 'crysense:history',
  alerts: 'crysense:alerts',
  settings: 'crysense:settings',
  temperature: 'crysense:temperature',
};
 
const DEFAULT_SETTINGS: AppSettings = {
  pushNotifications: true,
  temperatureAlerts: true,
  tempMin: 20,
  tempMax: 26,
};
 
export const storage = {
  getHistory(): HistoryEntry[] {
    return JSON.parse(localStorage.getItem(KEYS.history) || '[]');
  },
  addHistory(entry: HistoryEntry) {
    const hist = storage.getHistory();
    hist.unshift(entry);
    localStorage.setItem(KEYS.history, JSON.stringify(hist.slice(0, 100)));
  },
 
  getAlerts(): Alert[] {
    return JSON.parse(localStorage.getItem(KEYS.alerts) || '[]');
  },
  addAlert(alert: Alert) {
    const alerts = storage.getAlerts();
    alerts.unshift(alert);
    localStorage.setItem(KEYS.alerts, JSON.stringify(alerts.slice(0, 50)));
  },
  markAlertRead(id: string) {
    const alerts = storage.getAlerts().map(a =>
      a.id === id ? { ...a, read: true } : a
    );
    localStorage.setItem(KEYS.alerts, JSON.stringify(alerts));
  },
  clearAlerts() {
    localStorage.setItem(KEYS.alerts, '[]');
  },
 
  getSettings(): AppSettings {
    const raw = localStorage.getItem(KEYS.settings);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  },
  saveSettings(s: AppSettings) {
    localStorage.setItem(KEYS.settings, JSON.stringify(s));
  },
 
  getTemperature(): TemperatureReading | null {
    const raw = localStorage.getItem(KEYS.temperature);
    return raw ? JSON.parse(raw) : null;
  },
  setTemperature(t: TemperatureReading) {
    localStorage.setItem(KEYS.temperature, JSON.stringify(t));
  },
};
 