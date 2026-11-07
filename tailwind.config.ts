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
        // Modern Design System Tokens from DESIGN.md
        primary: {
          DEFAULT: "#426164",
          container: "#5a7a7d",
          fixed: "#c7e9ec",
          "fixed-dim": "#abcdd0",
        },
        "on-primary": "#ffffff",
        "on-primary-container": "#f5feff",
        secondary: {
          DEFAULT: "#556062",
          container: "#d8e5e7",
          fixed: "#d8e5e7",
          "fixed-dim": "#bcc9cb",
        },
        "on-secondary": "#ffffff",
        "on-secondary-container": "#5b6668",
        tertiary: {
          DEFAULT: "#775442",
          container: "#926c59",
        },
        surface: {
          DEFAULT: "#faf9f9",
          dim: "#dadada",
          bright: "#faf9f9",
          variant: "#e3e2e2",
          subtle: "#f4f3f3",
          elevated: "#ffffff",
          overlay: "#ffffff",
          muted: "#eeeeed",
          border: "#e2e8f0",
          "border-subtle": "rgba(113, 120, 121, 0.15)",
          "container-lowest": "#ffffff",
          "container-low": "#f4f3f3",
          container: "#eeeeed",
          "container-high": "#e8e8e8",
          "container-highest": "#e3e2e2",
        },
        "on-surface": "#1a1c1c",
        "on-surface-variant": "#414849",
        outline: {
          DEFAULT: "#717879",
          variant: "#c1c8c8",
        },
        brand: {
          DEFAULT: "#426164",
          subtle: "#f0f5f6",
          accent: "#2f4f52",
          hindsight: "#426164",
          "hindsight-dark": "#2f4f52",
          cyan: "#0284c7",
          emerald: "#059669",
          amber: "#d97706",
          rose: "#e11d48",
        },
        // Backward-compatible tokens mapped cleanly to new palette
        canvas: {
          DEFAULT: "#faf9f9",
          dark: "#f4f3f3",
        },
        signal: {
          DEFAULT: "#426164",
          hover: "#2f4f52",
          subtle: "rgba(66, 97, 100, 0.12)",
        },
        sage: {
          DEFAULT: "#059669",
          subtle: "rgba(5, 150, 105, 0.12)",
        },
        text: {
          primary: "#1a1c1c",
          secondary: "#414849",
          muted: "#717879",
        },
        risk: {
          critical: "#dc2626",
          high: "#d97706",
          elevated: "#d97706",
          nominal: "#059669",
          verified: "#426164",
          insufficient: "#717879",
        },
        background: "#faf9f9",
        foreground: "#1a1c1c",
      },
      borderRadius: {
        sm: "0.25rem",
        DEFAULT: "0.5rem",
        md: "0.5rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        full: "9999px",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        panel: "0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.06)",
        "panel-subtle": "0 1px 3px 0 rgba(0, 0, 0, 0.06)",
        "panel-elevated": "0 4px 12px -2px rgba(0, 0, 0, 0.08)",
        "border-inset": "inset 0 1px 0 0 rgba(255, 255, 255, 0.6)",
      },
      fontFamily: {
        sans: ["Inter", "var(--font-geist-sans)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "var(--font-geist-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
