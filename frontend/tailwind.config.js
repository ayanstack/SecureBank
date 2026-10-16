/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          // Deep Blue surfaces (formerly white / light surfaces)
          navy: '#081526',       // Deepest navy for root page background
          dark: '#0B1F3A',       // Elevated blue card/panel surface (formerly white cards)
          card: '#0D274D',       // Primary elevated card background
          surface: '#12325E',    // Secondary surface / hover state
          border: '#1E4578',     // Blue surface border lines

          // Red Action Palette (formerly blue buttons, highlights, and primary actions)
          red: {
            DEFAULT: '#D62839',  // Primary action red (CTA buttons, active indicators)
            hover: '#BA1E2E',    // Darker red for hover/active states
            deep: '#8A1420',     // Deep red for special accents
            light: 'rgba(214, 40, 57, 0.15)', // Soft red glow / badge fill
          },

          // Typography tokens for dark blue backgrounds
          text: '#F7FAFF',       // High-contrast main text on blue surfaces
          muted: '#94B4DB',      // Accessible secondary text on blue surfaces
          subtle: '#628CBF',     // Subtle text for metadata and timestamps

          // Semantic indicators
          success: '#10B981',    // Emerald green for credits / active status
          warning: '#F59E0B',    // Amber for warnings / pending state
          accent: '#D62839',     // Red for alerts / debits / primary actions
          blue: '#004B8E',       // Primary brand blue
          light: '#163B6E',      // Darker blue accent container
          bg: '#081526',         // Global page background
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.4), 0 2px 6px -1px rgba(11, 31, 58, 0.6)',
        'card-hover': '0 10px 30px -4px rgba(0, 0, 0, 0.5), 0 4px 12px -1px rgba(214, 40, 57, 0.25)',
        'panel': '0 12px 36px -4px rgba(0, 0, 0, 0.6)',
        'glow-red': '0 0 20px rgba(214, 40, 57, 0.35)',
      }
    },
  },
  plugins: [],
}
