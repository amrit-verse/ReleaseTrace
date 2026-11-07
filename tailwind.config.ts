import type { Config } from "tailwindcss";

function withOpacity(variableName: string) {
  return `rgba(var(${variableName}), <alpha-value>)`;
}

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
          DEFAULT: withOpacity("--surface-rgb"),
          dim: withOpacity("--surface-dim-rgb"),
          bright: withOpacity("--surface-bright-rgb"),
          variant: withOpacity("--surface-dim-rgb"),
          subtle: withOpacity("--surface-subtle-rgb"),
          elevated: withOpacity("--surface-elevated-rgb"),
          overlay: withOpacity("--surface-overlay-rgb"),
          muted: withOpacity("--surface-muted-rgb"),
          border: withOpacity("--surface-border-rgb"),
          "border-subtle": withOpacity("--surface-border-subtle-rgb"),
          "container-lowest": withOpacity("--surface-container-lowest-rgb"),
          "container-low": withOpacity("--surface-container-low-rgb"),
          container: withOpacity("--surface-container-rgb"),
          "container-high": withOpacity("--surface-container-high-rgb"),
          "container-highest": withOpacity("--surface-container-highest-rgb"),
        },
        "on-surface": withOpacity("--text-primary-rgb"),
        "on-surface-variant": withOpacity("--text-secondary-rgb"),
        outline: {
          DEFAULT: "#717879",
          variant: "#c1c8c8",
        },
        brand: {
          DEFAULT: withOpacity("--signal-rgb"),
          subtle: withOpacity("--brand-subtle-rgb"),
          accent: withOpacity("--signal-hover-rgb"),
          hindsight: withOpacity("--signal-rgb"),
          "hindsight-dark": withOpacity("--signal-hover-rgb"),
          cyan: "#0284c7",
          emerald: "#059669",
          amber: "#d97706",
          rose: "#e11d48",
        },
        // Backward-compatible tokens mapped cleanly to new palette
        canvas: {
          DEFAULT: withOpacity("--canvas-rgb"),
          dark: withOpacity("--canvas-dark-rgb"),
        },
        signal: {
          DEFAULT: withOpacity("--signal-rgb"),
          hover: withOpacity("--signal-hover-rgb"),
          subtle: withOpacity("--signal-subtle-rgb"),
        },
        sage: {
          DEFAULT: withOpacity("--sage-rgb"),
          subtle: withOpacity("--sage-subtle-rgb"),
        },
        text: {
          primary: withOpacity("--text-primary-rgb"),
          secondary: withOpacity("--text-secondary-rgb"),
          muted: withOpacity("--text-muted-rgb"),
        },
        risk: {
          critical: "#dc2626",
          high: "#d97706",
          elevated: "#d97706",
          nominal: "#059669",
          verified: "#426164",
          insufficient: "#717879",
        },
        background: withOpacity("--canvas-rgb"),
        foreground: withOpacity("--text-primary-rgb"),
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
        sans: ["var(--font-sans)", "Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
