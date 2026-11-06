"use client";

import React from "react";
import { motion } from "motion/react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { fadeInVariants } from "@/lib/motion";

interface ErrorStateProps {
  title?: string;
  message: string;
  details?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Telemetry Evaluation Interrupted",
  message,
  details,
  onRetry,
}: ErrorStateProps) {
  return (
    <motion.div
      variants={fadeInVariants}
      initial="hidden"
      animate="visible"
      className="p-6 border border-risk-critical/40 bg-surface rounded text-left space-y-3"
      role="alert"
    >
      <div className="flex items-center gap-2 text-risk-critical text-xs font-semibold uppercase tracking-wider">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>{title}</span>
      </div>

      <p className="text-xs text-text-secondary leading-relaxed">{message}</p>

      {details && (
        <pre className="p-2.5 bg-canvas border border-surface-border rounded text-[11px] font-mono text-text-muted overflow-x-auto whitespace-pre-wrap">
          {details}
        </pre>
      )}

      {onRetry && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface-elevated border border-surface-border text-xs text-text-primary hover:border-signal transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-signal" />
          <span>Retry Operation</span>
        </motion.button>
      )}
    </motion.div>
  );
}
