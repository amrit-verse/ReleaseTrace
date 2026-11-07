"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeMode =
  | "minimal"
  | "minimal-light"
  | "dark"
  | "light"
  | "warm-brown"
  | "cyber-teal"
  | "sunset-rose";

export interface ThemeOption {
  id: ThemeMode;
  name: string;
  category: "Light" | "Dark";
  bgPreview: string;
  borderPreview: string;
  accentPreview: string;
  description: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "minimal",
    name: "Minimal Studio",
    category: "Dark",
    bgPreview: "#09090b",
    borderPreview: "#27272a",
    accentPreview: "#38bdf8",
    description: "Ultra-clean zinc monochrome with razor 1px borders & zero clutter",
  },
  {
    id: "minimal-light",
    name: "Minimal Paper",
    category: "Light",
    bgPreview: "#ffffff",
    borderPreview: "#e4e4e7",
    accentPreview: "#0284c7",
    description: "Quiet crisp white canvas with subtle neutral borders & high contrast",
  },
  {
    id: "dark",
    name: "Midnight Obsidian",
    category: "Dark",
    bgPreview: "#0b1220",
    borderPreview: "#1e293b",
    accentPreview: "#38bdf8",
    description: "Deep dark navy with electric cyan & specular rims",
  },
  {
    id: "light",
    name: "Pristine White",
    category: "Light",
    bgPreview: "#ffffff",
    borderPreview: "#e2e8f0",
    accentPreview: "#0284c7",
    description: "Crisp white canvas with subtle pastel glass refraction",
  },
  {
    id: "warm-brown",
    name: "Mocha & Stone",
    category: "Dark",
    bgPreview: "#221f1d",
    borderPreview: "#38322e",
    accentPreview: "#f59e0b",
    description: "Warm grey & espresso brown with bronze amber glow",
  },
  {
    id: "cyber-teal",
    name: "Emerald Aurora",
    category: "Dark",
    bgPreview: "#0b1f1a",
    borderPreview: "#134e4a",
    accentPreview: "#10b981",
    description: "Deep forest slate with luminous mint and sage orbs",
  },
  {
    id: "sunset-rose",
    name: "Twilight Amethyst",
    category: "Dark",
    bgPreview: "#181126",
    borderPreview: "#3b1e54",
    accentPreview: "#ec4899",
    description: "Moody deep purple canvas with neon rose & violet blur",
  },
];

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleMode: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  setTheme: () => {},
  toggleMode: () => {},
  isDark: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("light");

  const isDarkTheme = (t: ThemeMode) => t !== "light" && t !== "minimal-light";

  useEffect(() => {
    try {
      const saved = localStorage.getItem("releasetrace-theme") as ThemeMode | null;
      if (saved && THEME_OPTIONS.some((o) => o.id === saved)) {
        setThemeState(saved);
        document.documentElement.setAttribute("data-theme", saved);
        document.documentElement.classList.toggle("dark", isDarkTheme(saved));
      } else {
        document.documentElement.setAttribute("data-theme", "light");
        document.documentElement.classList.remove("dark");
      }
    } catch {}
  }, []);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem("releasetrace-theme", newTheme);
      document.documentElement.setAttribute("data-theme", newTheme);
      document.documentElement.classList.toggle("dark", isDarkTheme(newTheme));
    } catch {}
  };

  const isDark = isDarkTheme(theme);

  const toggleMode = () => {
    if (isDark) {
      setTheme(theme === "minimal" ? "minimal-light" : "light");
    } else {
      setTheme(theme === "minimal-light" ? "minimal" : "dark");
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleMode, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
