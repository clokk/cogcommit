import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Agentlogs brand colors
        "chronicle-blue": "#60a5fa",
        "chronicle-green": "#34d399",
        "chronicle-amber": "#fbbf24",
        "chronicle-purple": "#a78bfa",
        panel: "#18181b",
        "panel-alt": "#1f1f23",
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
  plugins: [],
};

export default config;
