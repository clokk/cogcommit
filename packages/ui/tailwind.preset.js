/**
 * Shared Tailwind CSS preset for CogCommit
 * Uses warm brown theme from CLI Studio
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        // Background colors (warm browns)
        bg: "#0d0b0a",
        "bg-primary": "#0d0b0a",
        "bg-secondary": "#181614",
        panel: "#181614",
        "panel-alt": "#1e1b18",
        "bg-tertiary": "#1e1b18",
        border: "#2a2520",

        // Primary Accent (burnt orange)
        accent: {
          DEFAULT: "#e07b39",
          hover: "#c66a2d",
        },

        // Text colors
        text: {
          primary: "#e8e4df",
          muted: "#a39e97",
          subtle: "#6d6862",
        },

        // Semantic colors - dusty variants
        "chronicle-blue": "#4f7d8d",
        "chronicle-green": "#5a9a7a",
        "chronicle-amber": "#b8923a",
        "chronicle-purple": "#8a7aab",
        "chronicle-red": "#b85a5a",

        // Commit states
        "commit-closed": "#5a9a7a",
        "commit-open": "#b8923a",
        "user-accent": "#3d84a8",
        parallel: "#9d7cd8",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "Fira Code", "JetBrains Mono", "monospace"],
      },
      animation: {
        "slide-in": "slideIn 0.2s ease-out",
        expand: "expand 0.2s ease-out",
      },
      keyframes: {
        slideIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        expand: {
          "0%": { opacity: "0", maxHeight: "0" },
          "100%": { opacity: "1", maxHeight: "500px" },
        },
      },
    },
  },
};
