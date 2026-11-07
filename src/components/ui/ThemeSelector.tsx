"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sun, Moon, Palette, Check, Sparkles } from "lucide-react";
import { useTheme, THEME_OPTIONS } from "./ThemeProvider";

export function ThemeSelector() {
  const { theme, setTheme, toggleMode, isDark } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentThemeObj = THEME_OPTIONS.find((t) => t.id === theme) || THEME_OPTIONS[0];

  return (
    <div className="flex items-center gap-1.5" ref={containerRef}>
      {/* 1-Click Light / Dark Mode Toggle Button with Tactile Shadow */}
      <button
        onClick={toggleMode}
        aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        className="w-9 h-9 rounded-full liquid-glass-pill flex items-center justify-center transition-all active:scale-95 shadow-sm"
      >
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
        ) : (
          <Moon className="w-4 h-4 text-slate-700 hover:-rotate-12 transition-transform" />
        )}
      </button>

      {/* Theme Palette Dropdown Button with Swatch Pill */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          aria-label="Select Theme Color"
          title="Color themes & appearance"
          className="flex items-center gap-2 px-3 py-1.5 rounded-full liquid-glass-pill transition-all active:scale-95 text-xs font-semibold shadow-sm"
        >
          <span
            className="w-3.5 h-3.5 rounded-full border border-black/10 dark:border-white/20 shadow-xs flex-shrink-0"
            style={{ backgroundColor: currentThemeObj.accentPreview }}
          />
          <Palette className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300 hidden sm:inline" />
          <span className="font-mono text-[11px] hidden md:inline truncate max-w-[110px]">
            {currentThemeObj.name}
          </span>
        </button>

        {/* Dropdown Popover */}
        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl liquid-glass-card p-3 z-50 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Popover Header */}
            <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-slate-200/60 dark:border-white/10">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-mono text-[11px] uppercase tracking-wider font-bold">
                  Color Themes
                </span>
              </div>
              <span className="font-mono text-[10px] opacity-75 font-semibold px-2 py-0.5 rounded-full liquid-glass-pill">
                Liquid Glass
              </span>
            </div>

            {/* Theme Options List */}
            <div className="space-y-1">
              {THEME_OPTIONS.map((opt) => {
                const isSelected = opt.id === theme;
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setTheme(opt.id);
                      setDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                      isSelected ? "theme-option-selected" : "theme-option-default"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Swatch circle preview */}
                      <div
                        className="w-5 h-5 rounded-full border border-white/60 shadow-xs flex-shrink-0 flex items-center justify-center"
                        style={{ backgroundColor: opt.bgPreview }}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: opt.accentPreview }}
                        />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[12px] truncate leading-tight font-medium">
                          {opt.name}
                        </span>
                        <span className="text-[10px] opacity-70 truncate">
                          {opt.category} • {opt.description.split(" ")[0]}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
