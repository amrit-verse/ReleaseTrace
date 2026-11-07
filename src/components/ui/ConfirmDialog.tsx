"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, X } from "lucide-react";
import { modalVariants, backdropVariants } from "@/lib/motion";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "neutral";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "neutral",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  const confirmBtnClass =
    variant === "danger"
      ? "bg-risk-critical hover:bg-red-600 text-white"
      : variant === "warning"
      ? "bg-risk-warning hover:bg-amber-600 text-black font-semibold"
      : "bg-signal hover:bg-signal-hover text-canvas font-semibold";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onCancel}
            className="fixed inset-0 bg-[#1a1c1c]/40 backdrop-blur-[2px]"
          />
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            className="relative w-full max-w-md bg-surface-elevated border border-surface-border rounded shadow-panel-elevated p-5 z-10"
          >
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2 text-sm font-semibold text-text-primary" id="dialog-title">
                {variant !== "neutral" && (
                  <AlertTriangle
                    className={`w-4 h-4 shrink-0 ${
                      variant === "danger" ? "text-risk-critical" : "text-risk-warning"
                    }`}
                  />
                )}
                <span>{title}</span>
              </div>
              <button
                onClick={onCancel}
                className="text-text-muted hover:text-text-primary p-0.5 rounded transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 text-xs text-text-secondary leading-relaxed font-sans">
              {description}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCancel}
                className="px-3 py-1.5 rounded text-xs text-text-secondary bg-surface border border-surface-border hover:bg-surface-subtle transition-colors"
              >
                {cancelLabel}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onConfirm}
                className={`px-3 py-1.5 rounded text-xs transition-colors ${confirmBtnClass}`}
              >
                {confirmLabel}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
