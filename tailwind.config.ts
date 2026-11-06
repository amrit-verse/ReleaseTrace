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
        // Engineering Design System Tokens (Obsidian / Graphite / Signal Blue / Verified Sage)
        canvas: {
          DEFAULT: "#101820", // Obsidian base
          dark: "#0C131A",
        },
        surface: {
          DEFAULT: "#1B2A36", // Graphite
          subtle: "#16232D",
          elevated: "#223340", // Elevated surface
          overlay: "#283C4C",
          muted: "#1B2A36",
          border: "#243746",
          "border-subtle": "rgba(154, 170, 182, 0.15)",
        },
        signal: {
          DEFAULT: "#63B9D8", // Signal Blue
          hover: "#78C6E2",
          subtle: "rgba(99, 185, 216, 0.12)",
        },
        sage: {
          DEFAULT: "#A3BFAF", // Verified Sage
          subtle: "rgba(163, 191, 175, 0.15)",
        },
        text: {
          primary: "#F1F5F8",
          secondary: "#9AAAB6",
          muted: "#647B8C",
        },
        risk: {
          critical: "#D96B6B",
          high: "#E5A93C",
          elevated: "#E5A93C",
          nominal: "#A3BFAF",
          verified: "#63B9D8",
          insufficient: "#647B8C",
        },
        // Backward-compatible tokens
        background: "#101820",
        foreground: "#F1F5F8",
        brand: {
          hindsight: "#63B9D8", // Signal Blue
          "hindsight-dark": "#1B2A36",
          cyan: "#63B9D8",
          emerald: "#A3BFAF",
          amber: "#E5A93C",
          rose: "#D96B6B",
        },
      },
      fontFamily: {
        mono: [
          "var(--font-geist-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
        sans: [
          "var(--font-geist-sans)",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      boxShadow: {
        "panel-subtle": "0 1px 3px 0 rgba(0, 0, 0, 0.35)",
        "panel-elevated": "0 4px 16px -2px rgba(0, 0, 0, 0.45)",
        "border-inset": "inset 0 1px 0 0 rgba(255, 255, 255, 0.05)",
      },
      borderRadius: {
        sm: "3px",
        DEFAULT: "4px",
        md: "6px",
        lg: "8px",
      },
    },
  },
  plugins: [],
};

export default config;
