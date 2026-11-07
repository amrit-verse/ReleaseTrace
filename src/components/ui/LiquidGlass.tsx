"use client";

import React, { useEffect, useState } from "react";

export interface LiquidGlassProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
  variant?: "regular" | "clear";
  shape?: "rect" | "capsule";
  radius?: number;
  tint?: string;
  scheme?: "auto" | "light" | "dark";
  interactive?: boolean;
  className?: string;
  glow?: boolean;
}

export function LiquidGlass({
  children,
  variant = "regular",
  shape = "rect",
  radius = 16,
  tint,
  scheme = "auto",
  interactive = false,
  className = "",
  glow = false,
  style,
  ...props
}: LiquidGlassProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Dynamically register <liquid-glass> custom element in the browser
    import("@shayxo.dev/liquidglass").then(() => {
      setMounted(true);
    }).catch(() => {
      // Fallback gracefully to CSS liquid glass if web component script fails
      setMounted(false);
    });
  }, []);

  const glassStyle: React.CSSProperties = {
    borderRadius: shape === "capsule" ? "9999px" : `${radius}px`,
    ...style,
  };

  // If mounted and custom element is registered, use native <liquid-glass> custom element
  if (mounted) {
    return React.createElement(
      "liquid-glass",
      {
        variant,
        shape,
        radius,
        tint,
        scheme,
        interactive: interactive ? "" : undefined,
        class: `liquid-glass-wrapper relative ${glow ? "liquid-glass-glow" : ""} ${className}`,
        style: glassStyle,
        ...props,
      },
      children
    );
  }

  // SSR / Fallback CSS Liquid Glass Container
  return (
    <div
      className={`liquid-glass-card ${shape === "capsule" ? "rounded-full" : ""} ${
        glow ? "liquid-glass-glow" : ""
      } ${className}`}
      style={glassStyle}
      {...props}
    >
      {children}
    </div>
  );
}

