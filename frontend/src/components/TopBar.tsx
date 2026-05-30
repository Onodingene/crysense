import { theme } from '../lib/theme';
 
export function TopBar({ title, subtitle, action }: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header style={{
      background: theme.colors.surface,
      borderBottom: `1px solid ${theme.colors.borderLight}`,
      padding: '20px 20px 16px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div>
        <h1 style={{
          fontSize: 22,
          fontWeight: 700,
          margin: 0,
          letterSpacing: '-0.02em',
          color: theme.colors.text,
        }}>{title}</h1>
        {subtitle && (
          <p style={{
            fontSize: 13,
            margin: '2px 0 0',
            color: theme.colors.textMuted,
          }}>{subtitle}</p>
        )}
      </div>
      {action}
    </header>
  );
}
 