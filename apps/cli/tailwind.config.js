import uiPreset from "@cogcommit/ui/tailwind.preset";

/** @type {import('tailwindcss').Config} */
export default {
  presets: [uiPreset],
  content: [
    "./src/studio/frontend/**/*.{html,tsx,ts}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Additional accent colors
        accent: {
          DEFAULT: "#e07b39",
          hover: "#c66a2d",
        },
        // Text colors
        text: "#e8e4df",
        muted: "#a39e97",
        subtle: "#6d6862",
        // Legacy aliases for backward compat
        "commit-closed": "#5fb88e",
        "commit-open": "#d4a030",
        "user-accent": "#3d84a8",
        parallel: "#9d7cd8",
      },
      fontFamily: {
        sans: ['"Source Serif 4"', "Georgia", "serif"],
        mono: ['"Fira Code"', '"JetBrains Mono"', "monospace"],
      },
    },
  },
  plugins: [],
};
