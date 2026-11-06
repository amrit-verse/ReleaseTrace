"use client";

import React, { useState } from "react";
import { EngineerVerificationAction } from "@/types";
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  User,
  KeyRound,
} from "lucide-react";

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
      // Toggle logic
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
    <div className="bg-surface border border-surface-border rounded-lg overflow-hidden font-sans">
      <div className="p-4 bg-surface-subtle/50 border-b border-surface-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-zinc-100">
            Engineer Pre-Rollout Verification Gates
          </h3>
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="text-zinc-400">Status:</span>
          <span
            className={`font-semibold px-2 py-0.5 rounded border ${
              isFullySatisfied
                ? "bg-emerald-950/60 text-emerald-400 border-emerald-800"
                : "bg-amber-950/50 text-amber-400 border-amber-800"
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
                        ? "bg-purple-950/50 text-purple-300 border-purple-800/40"
                        : action.category === "LOAD_VERIFY"
                        ? "bg-blue-950/50 text-blue-300 border-blue-800/40"
                        : action.category === "ROLLBACK_PREP"
                        ? "bg-emerald-950/50 text-emerald-300 border-emerald-800/40"
                        : "bg-zinc-800 text-zinc-300 border-zinc-700"
                    }`}
                  >
                    {action.category}
                  </span>
                  <span className="font-semibold text-zinc-200">
                    {action.label}
                  </span>
                  {action.required && (
                    <span className="text-[10px] text-red-400 font-mono">*REQUIRED</span>
                  )}
                </div>

                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  {action.description}
                </p>

                {(action.verifiedBy || action.notes) && (
                  <div className="text-[10px] font-mono text-zinc-500 flex flex-wrap items-center gap-2 pt-0.5">
                    {action.verifiedBy && (
                      <span className="flex items-center gap-1 text-zinc-400">
                        <User className="w-3 h-3 text-zinc-500" />
                        <span>Signed off by: {action.verifiedBy}</span>
                      </span>
                    )}
                    {action.timestamp && (
                      <span>• {new Date(action.timestamp).toLocaleTimeString()}</span>
                    )}
                    {action.notes && (
                      <span className="text-amber-400/90 italic">
                        Note: &ldquo;{action.notes}&rdquo;
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 shrink-0 self-end md:self-center font-mono">
                <button
                  onClick={() => toggleActionStatus(action.id)}
                  className={`px-3 py-1.5 rounded text-xs font-medium border flex items-center space-x-1.5 transition-colors ${
                    isPassed
                      ? "bg-emerald-950/70 text-emerald-300 border-emerald-700 hover:bg-emerald-900/60"
                      : "bg-surface-subtle text-zinc-400 border-surface-border hover:bg-surface-border hover:text-zinc-200"
                  }`}
                >
                  <CheckCircle2 className={`w-3.5 h-3.5 ${isPassed ? "text-emerald-400" : "text-zinc-500"}`} />
                  <span>{isPassed ? "VERIFIED" : "VERIFY"}</span>
                </button>

                {!isPassed && !isOverridden && (
                  <button
                    onClick={() => setOverrideModalAction(action)}
                    className="px-2.5 py-1.5 rounded text-xs text-amber-400 bg-amber-950/30 border border-amber-800/40 hover:bg-amber-900/40 transition-colors flex items-center space-x-1"
                    title="Staff Engineer Override"
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>OVERRIDE</span>
                  </button>
                )}

                {isOverridden && (
                  <span className="px-2.5 py-1 rounded text-[11px] font-mono font-semibold bg-amber-950/60 text-amber-300 border border-amber-700">
                    OVERRIDDEN
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Override Modal */}
      {overrideModalAction && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-surface-border rounded-lg max-w-lg w-full p-5 space-y-4 shadow-technical-md">
            <div className="flex items-center space-x-2 text-amber-400 border-b border-surface-border pb-3">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h4 className="font-semibold text-sm text-zinc-100">
                Staff Engineer Override Protocol
              </h4>
            </div>

            <div className="text-xs text-zinc-300 space-y-2">
              <p>
                You are overriding mandatory verification gate:
              </p>
              <div className="p-2.5 rounded bg-surface-subtle border border-surface-border font-mono text-zinc-200">
                {overrideModalAction.label}
              </div>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Authorizing Engineer ID:</label>
                <input
                  type="text"
                  value={overrideEngineer}
                  onChange={(e) => setOverrideEngineer(e.target.value)}
                  className="w-full bg-surface-subtle border border-surface-border p-2 rounded text-zinc-200 text-xs focus:outline-none focus:border-brand-hindsight"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">
                  Incident Mitigation / Justification Note:
                </label>
                <textarea
                  rows={3}
                  value={overrideJustification}
                  onChange={(e) => setOverrideJustification(e.target.value)}
                  placeholder="e.g. Backfilled database on separate maintenance thread. Rollback runbook tested and verified in hotfix pod."
                  className="w-full bg-surface-subtle border border-surface-border p-2 rounded text-zinc-200 text-xs focus:outline-none focus:border-brand-hindsight font-sans"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-surface-border font-mono text-xs">
              <button
                onClick={() => setOverrideModalAction(null)}
                className="px-3 py-1.5 rounded text-zinc-400 hover:text-white border border-surface-border hover:bg-surface-subtle"
              >
                CANCEL
              </button>
              <button
                onClick={handleApplyOverride}
                className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-black font-semibold"
              >
                CONFIRM OVERRIDE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
