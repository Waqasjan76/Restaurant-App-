// Single source of truth for colours. Every screen reads its palette through
// useTheme(), so toggling dark mode restyles the whole app at once.

export const lightColors = {
  background: '#fffaf5',
  card: '#ffffff',
  text: '#222222',
  textMuted: '#6b6b6b',
  border: '#efe4d8',
  primary: '#e4572e',
  onPrimary: '#ffffff',
  input: '#ffffff',
  subtle: '#f5ede4',
  danger: '#d93025',
  success: '#2e9d5b',
  warning: '#f2a900',
  onWarning: '#3a2a00',
  disabled: '#b5b5b5',
  overlay: 'rgba(0,0,0,0.45)',
  fab: '#222222',
  onFab: '#ffffff',
  tiles: {
    Starters: '#fde2c8',
    Mains: '#fbd0c4',
    Desserts: '#f6d3e6',
    Drinks: '#cfe8f5',
  },
};

export const darkColors = {
  background: '#121212',
  card: '#1d1d1f',
  text: '#f2f2f2',
  textMuted: '#a3a3a3',
  border: '#2e2e30',
  primary: '#ff7a50',
  onPrimary: '#1a0d08',
  input: '#262628',
  subtle: '#2a2a2c',
  danger: '#ff6b60',
  success: '#4cc27f',
  warning: '#ffc233',
  onWarning: '#2b1f00',
  disabled: '#555555',
  overlay: 'rgba(0,0,0,0.65)',
  fab: '#f2f2f2',
  onFab: '#121212',
  tiles: {
    Starters: '#4a3524',
    Mains: '#4d2b25',
    Desserts: '#47293a',
    Drinks: '#223c4a',
  },
};
