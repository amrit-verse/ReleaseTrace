"use client";

import React from "react";
import { motion } from "motion/react";
import { fadeInVariants } from "@/lib/motion";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function PageHeader({
  title,
  subtitle,
  badge,
  actions,
  breadcrumbs,
}: PageHeaderProps) {
  return (
    <motion.header
      variants={fadeInVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80"
    >
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 mb-1">
            {breadcrumbs.map((b, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-slate-400">/</span>}
                {b.href ? (
                  <a href={b.href} className="hover:text-slate-900 transition-colors font-medium">
                    {b.label}
                  </a>
                ) : (
                  <span className="text-slate-600 font-semibold">{b.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        <div className="flex items-center gap-2.5">
          <h1 className="text-lg font-extrabold tracking-tight text-slate-900">{title}</h1>
          {badge}
        </div>
        {subtitle && (
          <p className="text-xs text-slate-600 mt-0.5 font-sans leading-normal">
            {subtitle}
          </p>
        )}
      </div>

      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </motion.header>
  );
}
