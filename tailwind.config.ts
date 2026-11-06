import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#08090d",
        foreground: "#f3f4f6",
        surface: {
          DEFAULT: "#0f1118",
          subtle: "#141722",
          muted: "#1a1e2d",
          border: "#23293d",
          "border-subtle": "#1b2030",
        },
        risk: {
          critical: "#ef4444",
          high: "#f97316",
          elevated: "#eab308",
          nominal: "#10b981",
          verified: "#06b6d4",
        },
        brand: {
          hindsight: "#8b5cf6",
          "hindsight-dark": "#6d28d9",
          cyan: "#06b6d4",
          emerald: "#10b981",
          amber: "#f59e0b",
          rose: "#f43f5e",
        },
      },
      fontFamily: {
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        "technical-sm": "0 1px 2px 0 rgba(0, 0, 0, 0.45)",
        "technical-md": "0 4px 12px 0 rgba(0, 0, 0, 0.55)",
        "technical-border": "0 0 0 1px rgba(255, 255, 255, 0.07)",
        "glow-critical": "0 0 15px -3px rgba(239, 68, 68, 0.25)",
        "glow-nominal": "0 0 15px -3px rgba(16, 185, 129, 0.25)",
        "glow-hindsight": "0 0 15px -3px rgba(139, 92, 246, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
