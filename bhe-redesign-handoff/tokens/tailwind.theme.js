// bheeagles.com redesign — Tailwind theme extension
// Merge into tailwind.config: theme: { extend: require('./tailwind.theme.js') }
// (or for Tailwind v4, mirror these as @theme variables using tokens.css)

module.exports = {
  colors: {
    bhe: {
      green: '#173D2E',
      'green-2': '#2E6B4F',
      'green-line': '#2C5243',
      gold: '#F3B23C',
      paper: '#F6F1E7',
      'paper-2': '#F1EADC',
      card: '#FFFFFF',
      'card-alt': '#FBF8F2',
      ink: '#173D2E',
      body: '#374151',
      muted: '#4B5563',
      'on-green': '#F6F1E7',
      'on-green-muted': '#D3E0D8',
      error: '#B42318',
      border: '#E3DACB',
      'border-input': '#CFC5B3',
      'tint-green': '#E4EEE7',
      'tint-gold': '#FCEBC7',
      'tint-blue': '#E1E9F3',
    },
  },
  fontFamily: {
    display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
    body: ['Figtree', 'system-ui', 'sans-serif'],
  },
  borderRadius: {
    input: '12px',
    tile: '14px',
    card: '20px',
    panel: '28px',
  },
  maxWidth: {
    container: '1240px',
  },
  boxShadow: {
    float: '0 12px 30px rgba(23, 61, 46, 0.18)',
    form: '0 16px 40px rgba(23, 61, 46, 0.10)',
  },
};
