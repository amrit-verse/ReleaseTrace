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
        // Stitch Design System Tokens (Modern / Corporate — light, calm slate-teal)
        // Source: DESIGN.md from the Stitch redesign export.
        canvas: {
          DEFAULT: "#faf9f9", // Stitch surface / background
          dark: "#dadada", // surface-dim
        },
        surface: {
          DEFAULT: "#ffffff", // surface-container-lowest — cards
          subtle: "#f4f3f3", // surface-container-low
          elevated: "#f4f3f3", // inset / chip background
          overlay: "#eeeeed", // surface-container
          muted: "#f4f3f3",
          border: "#e3e2e2", // surface-container-highest
          "border-subtle": "rgba(65, 72, 73, 0.12)",
        },
        // Stitch primary — deep slate-teal
        signal: {
          DEFAULT: "#426164",
          hover: "#5a7a7d", // primary-container
          subtle: "rgba(66, 97, 100, 0.10)",
        },
        primary: {
          DEFAULT: "#426164",
          container: "#5a7a7d",
        },
        // Verified / healthy — deepened sage so text stays readable on light tints
        sage: {
          DEFAULT: "#3e7c59",
          subtle: "rgba(62, 124, 89, 0.12)",
        },
        text: {
          primary: "#1a1c1c", // on-surface
          secondary: "#414849", // on-surface-variant
          muted: "#717879", // outline
        },
        risk: {
          critical: "#ba1a1a", // Stitch error
          high: "#b45309",
          elevated: "#b45309",
          nominal: "#3e7c59",
          verified: "#426164",
          insufficient: "#717879",
        },
        // Backward-compatible tokens
        background: "#faf9f9",
        foreground: "#1a1c1c",
        brand: {
          hindsight: "#426164",
          "hindsight-dark": "#2c4c4f",
          cyan: "#426164",
          emerald: "#3e7c59",
          amber: "#b45309",
          rose: "#ba1a1a",
          subtle: "#f0f5f6", // brand-subtle from the Stitch mock
          accent: "#2f4f52",
        },
      },
      fontFamily: {
        mono: [
          "var(--font-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
        sans: [
          "var(--font-sans)",
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      boxShadow: {
        // Stitch elevation: tonal layering + subtle, diffused shadows
        "panel-subtle": "0 1px 3px 0 rgba(26, 28, 28, 0.06)",
        panel: "0 1px 3px 0 rgba(26, 28, 28, 0.06)",
        "panel-elevated": "0 8px 24px -8px rgba(26, 28, 28, 0.14)",
        "border-inset": "inset 0 1px 0 0 rgba(255, 255, 255, 0.6)",
      },
      borderRadius: {
        // Stitch rounded scale (roundedness 2)
        sm: "0.375rem",
        DEFAULT: "0.5rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
