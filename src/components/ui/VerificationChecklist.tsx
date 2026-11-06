"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { EngineerVerificationAction } from "@/types";
import {
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  User,
  KeyRound,
  X,
} from "lucide-react";
import { modalVariants, backdropVariants, hoverSubtle, tapSubtle } from "@/lib/motion";

interface VerificationChecklistProps {
  initialActions: EngineerVerificationAction[];
  deploymentId: string;
  onActionsUpdated?: (updated: EngineerVerificationAction[]) => void;
}

export function VerificationChecklist({
  initialActions,
  deploymentId,
  onActionsUpdated,
}: VerificationChecklistProps) {
  const [actions, setActions] = useState<EngineerVerificationAction[]>(initialActions);
  const [overrideModalAction, setOverrideModalAction] = useState<EngineerVerificationAction | null>(null);
  const [overrideJustification, setOverrideJustification] = useState("");
  const [overrideEngineer, setOverrideEngineer] = useState("amrit.lead@engineering.internal");

  const toggleActionStatus = (actionId: string) => {
    const updated = actions.map((act) => {
      if (act.id !== actionId) return act;
      if (act.status === "PENDING") {
        return {
          ...act,
          status: "PASSED" as const,
          verifiedBy: "current.user@engineering.internal",
          timestamp: new Date().toISOString(),
        };
      } else if (act.status === "PASSED") {
        return {
          ...act,
          status: "PENDING" as const,
          verifiedBy: undefined,
          timestamp: undefined,
        };
      }
      return act;
    });

    setActions(updated);
    if (onActionsUpdated) onActionsUpdated(updated);
  };

  const handleApplyOverride = () => {
    if (!overrideModalAction) return;

    const updated = actions.map((act) => {
      if (act.id !== overrideModalAction.id) return act;
      return {
        ...act,
        status: "OVERRIDDEN" as const,
        verifiedBy: overrideEngineer,
        timestamp: new Date().toISOString(),
        notes: overrideJustification || "Staff Engineer manual override granted with mitigation.",
      };
    });

    setActions(updated);
    if (onActionsUpdated) onActionsUpdated(updated);
    setOverrideModalAction(null);
    setOverrideJustification("");
  };

  const passedCount = actions.filter((a) => a.status === "PASSED" || a.status === "OVERRIDDEN").length;
  const isFullySatisfied = passedCount === actions.length;

  return (
    <div className="bg-surface border border-surface-border rounded overflow-hidden font-sans shadow-panel">
      <div className="p-4 bg-surface-elevated/60 border-b border-surface-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-sage" />
          <h3 className="text-sm font-semibold text-text-primary">
            Engineer Pre-Rollout Verification Gates
          </h3>
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="text-text-muted">Status:</span>
          <span
            className={`font-semibold px-2 py-0.5 rounded border ${
              isFullySatisfied
                ? "bg-sage/15 text-sage border-sage/40"
                : "bg-risk-warning/15 text-risk-warning border-risk-warning/40"
            }`}
          >
            {passedCount} / {actions.length} GATES VERIFIED
          </span>
        </div>
      </div>

      <div className="p-4 divide-y divide-surface-border">
        {actions.map((action) => {
          const isPassed = action.status === "PASSED";
          const isOverridden = action.status === "OVERRIDDEN";

          return (
            <div
              key={action.id}
              className="py-3.5 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center space-x-2">
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${
                      action.category === "DRIFT"
                        ? "bg-signal/15 text-signal border-signal/30"
                        : action.category === "LOAD_VERIFY"
                        ? "bg-signal/15 text-signal border-signal/30"
                        : action.category === "ROLLBACK_PREP"
                        ? "bg-sage/15 text-sage border-sage/40"
                        : "bg-surface-elevated text-text-secondary border-surface-border"
                    }`}
                  >
                    {action.category}
                  </span>
                  <span className="font-semibold text-text-primary">
                    {action.label}
                  </span>
                  {action.required && (
                    <span className="text-[10px] text-risk-critical font-mono">*REQUIRED</span>
                  )}
                </div>

                <p className="text-text-secondary leading-relaxed text-[11px]">
                  {action.description}
                </p>

                {(action.verifiedBy || action.notes) && (
                  <div className="text-[10px] font-mono text-text-muted flex flex-wrap items-center gap-2 pt-0.5">
                    {action.verifiedBy && (
                      <span className="flex items-center gap-1 text-text-secondary">
                        <User className="w-3 h-3 text-text-muted" />
                        <span>Signed off by: {action.verifiedBy}</span>
                      </span>
                    )}
                    {action.timestamp && (
                      <span>• {new Date(action.timestamp).toLocaleTimeString()}</span>
                    )}
                    {action.notes && (
                      <span className="text-risk-warning italic">
                        Note: &ldquo;{action.notes}&rdquo;
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 shrink-0 self-end md:self-center font-mono">
                <motion.button
                  whileHover={hoverSubtle}
                  whileTap={tapSubtle}
                  onClick={() => toggleActionStatus(action.id)}
                  className={`px-3 py-1.5 rounded text-xs font-medium border flex items-center space-x-1.5 transition-colors ${
                    isPassed
                      ? "bg-sage/20 text-sage border-sage/50 hover:bg-sage/30"
                      : "bg-surface-elevated text-text-muted border-surface-border hover:bg-surface-elevated/80 hover:text-text-primary"
                  }`}
                >
                  <CheckCircle2 className={`w-3.5 h-3.5 ${isPassed ? "text-sage" : "text-text-muted"}`} />
                  <span>{isPassed ? "VERIFIED" : "VERIFY"}</span>
                </motion.button>

                {!isPassed && !isOverridden && (
                  <motion.button
                    whileHover={hoverSubtle}
                    whileTap={tapSubtle}
                    onClick={() => setOverrideModalAction(action)}
                    className="px-2.5 py-1.5 rounded text-xs text-risk-warning bg-risk-warning/15 border border-risk-warning/30 hover:bg-risk-warning/25 transition-colors flex items-center space-x-1"
                    title="Staff Engineer Override"
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>OVERRIDE</span>
                  </motion.button>
                )}

                {isOverridden && (
                  <span className="px-2.5 py-1 rounded text-[11px] font-mono font-semibold bg-risk-warning/20 text-risk-warning border border-risk-warning/40">
                    OVERRIDDEN
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Override Modal with Motion AnimatePresence */}
      <AnimatePresence>
        {overrideModalAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setOverrideModalAction(null)}
            />
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative z-10 bg-surface-elevated border border-surface-border rounded max-w-lg w-full p-5 space-y-4 shadow-panel-elevated"
            >
              <div className="flex items-center justify-between border-b border-surface-border pb-3">
                <div className="flex items-center space-x-2 text-risk-warning">
                  <AlertTriangle className="w-5 h-5 text-risk-warning" />
                  <h4 className="font-semibold text-sm text-text-primary">
                    Staff Engineer Override Protocol
                  </h4>
                </div>
                <button
                  onClick={() => setOverrideModalAction(null)}
                  className="text-text-muted hover:text-text-primary"
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-text-secondary space-y-2">
                <p>
                  You are overriding mandatory verification gate for deployment{" "}
                  <span className="font-mono text-signal">{deploymentId}</span>:
                </p>
                <div className="p-2.5 rounded bg-surface border border-surface-border font-mono text-text-primary">
                  {overrideModalAction.label}
                </div>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div>
                  <label className="text-text-muted block mb-1">Authorizing Engineer ID:</label>
                  <input
                    type="text"
                    value={overrideEngineer}
                    onChange={(e) => setOverrideEngineer(e.target.value)}
                    className="w-full bg-surface border border-surface-border p-2 rounded text-text-primary text-xs focus:outline-none focus:border-signal"
                  />
                </div>

                <div>
                  <label className="text-text-muted block mb-1">
                    Incident Mitigation / Justification Note:
                  </label>
                  <textarea
                    rows={3}
                    value={overrideJustification}
                    onChange={(e) => setOverrideJustification(e.target.value)}
                    placeholder="e.g. Backfilled database on separate maintenance thread. Rollback verified on staging."
                    className="w-full bg-surface border border-surface-border p-2 rounded text-text-primary text-xs focus:outline-none focus:border-signal font-sans"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-surface-border font-mono text-xs">
                <button
                  onClick={() => setOverrideModalAction(null)}
                  className="px-3 py-1.5 rounded text-text-muted hover:text-text-primary border border-surface-border"
                >
                  CANCEL
                </button>
                <motion.button
                  whileHover={hoverSubtle}
                  whileTap={tapSubtle}
                  onClick={handleApplyOverride}
                  className="px-4 py-1.5 rounded bg-risk-warning text-black font-semibold"
                >
                  CONFIRM OVERRIDE
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

