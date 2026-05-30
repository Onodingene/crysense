export const theme = {
  colors: {
    // Bright yellow accent
    primary: '#F5C518',
    primaryDark: '#D4A615',
    primaryLight: '#FFF4B8',

    // Dark navy palette
    background: '#1A2332',       // dark navy
    surface: '#243140',           // slightly lighter navy for cards
    surfaceAlt: '#2D3B4D',        // alt surface
    surfaceWarm: '#34435A',       // hover/active surface
    border: '#3A4A5E',            // subtle border
    borderLight: '#2F3D4E',       // even subtler

    // Text — light tones for dark background
    text: '#F1F5F9',              // near-white for headings/body
    textMuted: '#94A3B8',         // muted slate
    textLight: '#64748B',         // dimmer text

    // Semantic
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',

    // Cry classes
    hunger: '#F5C518',            // matches accent
    pain: '#EF4444',
    discomfort: '#A78BFA',
    sleepiness: '#60A5FA',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  radius: { sm: 6, md: 10, lg: 16, xl: 24, full: 999 },
  fonts: {
    display: "'Inter', system-ui, -apple-system, sans-serif",
    body: "'Inter', system-ui, -apple-system, sans-serif",
  },
};