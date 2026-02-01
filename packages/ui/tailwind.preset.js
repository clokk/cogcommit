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

        // Semantic colors
        "chronicle-blue": "#3d84a8",
        "chronicle-green": "#5fb88e",
        "chronicle-amber": "#d4a030",
        "chronicle-purple": "#9d7cd8",
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
