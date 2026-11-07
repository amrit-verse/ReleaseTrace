"use client";

import React from "react";
import { motion } from "motion/react";
import { LucideIcon, Inbox } from "lucide-react";
import { fadeInVariants } from "@/lib/motion";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
}: EmptyStateProps) {
  return (
    <motion.div
      variants={fadeInVariants}
      initial="hidden"
      animate="visible"
      className="p-8 border border-dashed border-surface-border rounded bg-surface/50 text-center flex flex-col items-center justify-center"
    >
      <div className="w-9 h-9 rounded bg-surface-elevated border border-surface-border flex items-center justify-center text-text-muted mb-3">
        <Icon className="w-4 h-4" />
      </div>
      <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider">{title}</h4>
      <p className="text-xs text-text-secondary max-w-sm mt-1 leading-relaxed">{description}</p>
      {action && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={action.onClick}
          className="mt-4 px-3 py-1.5 text-xs font-mono text-signal bg-signal-subtle border border-signal/40 rounded hover:bg-signal/20 transition-colors"
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}
