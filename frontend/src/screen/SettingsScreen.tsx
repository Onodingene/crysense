import { useState } from "react";
import { TopBar } from "../components/TopBar";
import { storage } from "../lib/storage";
import { theme } from "../lib/theme";

export function SettingsScreen() {
  const [settings, setSettings] = useState(storage.getSettings());
 
  const update = (patch: Partial<typeof settings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    storage.saveSettings(next);
  };
 
  return (
    <div style={{ paddingBottom: 90 }}>
      <TopBar title="Settings" subtitle="Manage your preferences" />
 
      <div style={{ padding: '16px 20px' }}>
 
        <SectionHeader>Notifications</SectionHeader>
        <SettingRow
          title="Push notifications"
          description="Receive alerts when cries are detected"
          control={
            <Toggle checked={settings.pushNotifications}
                    onChange={v => update({ pushNotifications: v })} />
          }
        />
        <SettingRow
          title="Temperature alerts"
          description="Warn when room is outside the safe range"
          control={
            <Toggle checked={settings.temperatureAlerts}
                    onChange={v => update({ temperatureAlerts: v })} />
          }
        />
 
        <SectionHeader>Safe temperature range</SectionHeader>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <RangeInput label="Min" value={settings.tempMin}
                      onChange={v => update({ tempMin: v })} />
          <RangeInput label="Max" value={settings.tempMax}
                      onChange={v => update({ tempMax: v })} />
        </div>
 
        <SectionHeader>About</SectionHeader>
        <SettingRow title="Version" description="CrySense v1.0.0" />
        <SettingRow title="Privacy" description="All audio is processed and immediately discarded. Nothing is stored." />
      </div>
    </div>
  );
}
 
 
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: theme.colors.textMuted,
      margin: '20px 0 10px',
    }}>{children}</h3>
  );
}
 
function SettingRow({ title, description, control }: {
  title: string;
  description?: string;
  control?: React.ReactNode;
}) {
  return (
    <div style={{
      background: theme.colors.surface,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: theme.radius.lg,
      padding: 16,
      marginBottom: 8,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: theme.colors.text }}>{title}</div>
        {description && (
          <div style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 2, lineHeight: 1.4 }}>
            {description}
          </div>
        )}
      </div>
      {control}
    </div>
  );
}
 
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} style={{
      width: 44, height: 26,
      borderRadius: 13,
      background: checked ? theme.colors.primary : theme.colors.border,
      border: 'none', cursor: 'pointer', padding: 0,
      position: 'relative',
      transition: 'background 0.2s',
    }}>
      <div style={{
        width: 22, height: 22,
        background: '#fff',
        borderRadius: '50%',
        position: 'absolute',
        top: 2,
        left: checked ? 20 : 2,
        transition: 'left 0.2s',
        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
      }} />
    </button>
  );
}
 
function RangeInput({ label, value, onChange }: {
  label: string; value: number; onChange: (v: number) => void;
}) {
  return (
    <div style={{
      flex: 1,
      background: theme.colors.surface,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: theme.radius.lg,
      padding: 16,
    }}>
      <div style={{ fontSize: 11, color: theme.colors.textMuted, fontWeight: 600,
                    letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
        <input
          type="number" step={0.5} value={value}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          style={{
            width: '100%', border: 'none', background: 'transparent',
            fontSize: 22, fontWeight: 700, color: theme.colors.text,
            outline: 'none', padding: 0,
          }}
        />
        <span style={{ fontSize: 14, color: theme.colors.textMuted, fontWeight: 600 }}>°C</span>
      </div>
    </div>
  );
}
 