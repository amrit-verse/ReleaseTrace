"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "warning" | "error" | "info";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<Toast, "id">) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, description, type, duration = 4000 }: Omit<Toast, "id">) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      setToasts((prev) => [...prev, { id, title, description, type, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((title: string, description?: string) => showToast({ title, description, type: "success" }), [showToast]);
  const error = useCallback((title: string, description?: string) => showToast({ title, description, type: "error" }), [showToast]);
  const warning = useCallback((title: string, description?: string) => showToast({ title, description, type: "warning" }), [showToast]);
  const info = useCallback((title: string, description?: string) => showToast({ title, description, type: "info" }), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon =
              toast.type === "success"
                ? CheckCircle2
                : toast.type === "warning"
                ? AlertTriangle
                : toast.type === "error"
                ? XCircle
                : Info;

            const borderClass =
              toast.type === "success"
                ? "border-sage text-sage"
                : toast.type === "warning"
                ? "border-risk-warning text-risk-warning"
                : toast.type === "error"
                ? "border-risk-critical text-risk-critical"
                : "border-signal text-signal";

            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.16 }}
                className="pointer-events-auto bg-surface-elevated border border-surface-border rounded shadow-panel-elevated p-3 flex items-start gap-2.5 text-xs text-text-primary"
                role="status"
              >
                <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${borderClass}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text-primary leading-tight">{toast.title}</p>
                  {toast.description && (
                    <p className="text-text-secondary mt-1 text-[11px] leading-normal font-mono">
                      {toast.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-text-muted hover:text-text-primary p-0.5 rounded transition-colors"
                  aria-label="Close notification"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
