import type { Config } from 'tailwindcss'

/**
 * Palette and scale are deliberately mid-2010s: institutional blues, small radii,
 * 1px hairline borders, gradient chrome. See src/app/globals.css for the
 * gradient/chrome layer that Tailwind utilities alone would not give us.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}', './content/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Institutional blue — matches the original site's #2d81c8 ticker strip.
        jnu: {
          50: '#eef5fb',
          100: '#d6e7f5',
          200: '#a9cbe9',
          300: '#6fa8d8',
          400: '#3d87c8',
          500: '#2d81c8', // primary, lifted from the original stylesheet
          600: '#1f6aa8',
          700: '#185484',
          800: '#123f63',
          900: '#0d2f4a',
        },
        // Mehrangarh sandstone — the accent for notices and calls to action.
        sand: {
          400: '#d99b4a',
          500: '#c8863a',
          600: '#a86d2b',
        },
        ink: '#333333',      // 2015 body copy was #333, not near-black
        muted: '#767676',
        hair: '#e1e1e1',     // hairline border
        shell: '#f4f4f4',    // page shell behind the boxed content
      },
      fontFamily: {
        // The original loaded Open Sans + Allerta. Kept for authenticity.
        sans: ['var(--font-open-sans)', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
        display: ['var(--font-allerta)', 'Trebuchet MS', 'Arial', 'sans-serif'],
      },
      fontSize: {
        // 2015 base was 13-14px, not 16px.
        base: ['14px', '1.65'],
        sm: ['13px', '1.6'],
        xs: ['11px', '1.5'],
      },
      borderRadius: {
        DEFAULT: '3px', // era-correct: 3px, never rounded-lg
        sm: '2px',
      },
      maxWidth: {
        boxed: '1210px', // Enfold's default content width
      },
      boxShadow: {
        chrome: '0 1px 2px rgba(0,0,0,.08)',
        raised: '0 1px 3px rgba(0,0,0,.12), inset 0 1px 0 rgba(255,255,255,.25)',
      },
    },
  },
  plugins: [],
}

export default config
