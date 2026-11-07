"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import {
  X,
  Zap,
  Play,
  CheckCircle2,
  BrainCircuit,
  Terminal,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useDevOpsGuide } from "@/context/DevOpsGuideContext";
import { RiskBadge } from "@/components/ui/StatusBadge";

interface PresetScenario {
  id: string;
  name: string;
  badge: string;
  badgeColor: string;
  description: string;
  payload: {
    service: string;
    environment: "production" | "staging";
    evidence: {
      commitSha: string;
      commitMessage: string;
      changedFiles: string[];
      hasPendingMigrations: boolean;
      migrationNames: string[];
    };
    environmentContext: {
      databaseType: string;
      databaseVersion: string;
      poolSize: number;
      replicas: number;
    };
  };
}

const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: "schema-lock",
    name: "Scenario A: Dangerous Database Migration on Postgres",
    badge: "CRITICAL RISK",
    badgeColor: "bg-risk-critical/20 text-risk-critical border-risk-critical/40",
    description: "Adds an exclusive lock on the active user transactions table while connection pool is undersized.",
    payload: {
      service: "payment-gateway",
      environment: "production",
      evidence: {
        commitSha: "c7a1024b",
        commitMessage: "feat(payments): add non-null transaction status column without default value",
        changedFiles: ["prisma/schema.prisma", "src/payments.ts"],
        hasPendingMigrations: true,
        migrationNames: ["20261107_add_transaction_status"],
      },
      environmentContext: {
        databaseType: "postgresql",
        databaseVersion: "17",
        poolSize: 10,
        replicas: 1,
      },
    },
  },
  {
    id: "pool-starvation",
    name: "Scenario B: Connection Pool Starvation Under Traffic",
    badge: "HIGH RISK",
    badgeColor: "bg-risk-high/20 text-risk-high border-risk-high/40",
    description: "Microservice configured with pool size 5 under high concurrency, risking P2024 pool timeouts.",
    payload: {
      service: "order-service",
      environment: "production",
      evidence: {
        commitSha: "e901f42a",
        commitMessage: "feat(checkout): parallelize inventory verification queries",
        changedFiles: ["src/checkout/inventory.ts"],
        hasPendingMigrations: false,
        migrationNames: [],
      },
      environmentContext: {
        databaseType: "postgresql",
        databaseVersion: "17",
        poolSize: 5,
        replicas: 2,
      },
    },
  },
  {
    id: "safe-routine",
    name: "Scenario C: Safe Routine Feature Release",
    badge: "LOW / NOMINAL",
    badgeColor: "bg-sage/20 text-sage border-sage/40",
    description: "Frontend button update with 0 database schema modifications and passing test coverage.",
    payload: {
      service: "frontend-dashboard",
      environment: "production",
      evidence: {
        commitSha: "b12fa099",
        commitMessage: "feat(ui): update navigation icons and accessibility labels",
        changedFiles: ["src/components/Header.tsx", "src/styles.css"],
        hasPendingMigrations: false,
        migrationNames: [],
      },
      environmentContext: {
        databaseType: "postgresql",
        databaseVersion: "17",
        poolSize: 20,
        replicas: 3,
      },
    },
  },
];

export function QuickReleaseSimulatorModal() {
  const { isSimulatorModalOpen, setIsSimulatorModalOpen } = useDevOpsGuide();
  const [selectedPresetId, setSelectedPresetId] = useState<string>("schema-lock");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isSimulatorModalOpen) return null;

  const currentPreset = PRESET_SCENARIOS.find((s) => s.id === selectedPresetId) || PRESET_SCENARIOS[0];

  const handleRunSimulation = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: currentPreset.payload.service,
          environment: currentPreset.payload.environment,
          commitSha: currentPreset.payload.evidence.commitSha,
          commitMessage: currentPreset.payload.evidence.commitMessage,
          changedFiles: currentPreset.payload.evidence.changedFiles,
          hasPendingMigrations: currentPreset.payload.evidence.hasPendingMigrations,
          migrationNames: currentPreset.payload.evidence.migrationNames,
          databaseType: currentPreset.payload.environmentContext.databaseType,
          databaseVersion: currentPreset.payload.environmentContext.databaseVersion,
          poolSize: currentPreset.payload.environmentContext.poolSize,
          replicas: currentPreset.payload.environmentContext.replicas,
        }),
      });

      if (!res.ok) {
        throw new Error(`Assessment API returned HTTP ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to run simulation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => setIsSimulatorModalOpen(false)}
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative z-10 w-full max-w-4xl bg-surface border border-surface-border rounded-xl shadow-2xl overflow-hidden font-sans flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-border bg-surface-elevated">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sage/20 text-sage border border-sage/40 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-text-primary">
                  Interactive Release Simulator (Student Sandbox)
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface text-signal border border-surface-border">
                  Live API Connected
                </span>
              </div>
              <p className="text-xs text-text-muted font-mono">
                Select a simulated release scenario and see how ReleaseTrace&apos;s intelligence engine evaluates it in real-time.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsSimulatorModalOpen(false)}
            className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-surface transition-colors"
            aria-label="Close simulator modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Preset Scenario Selector */}
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider font-mono block mb-2">
              Choose a Release Scenario to Test:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {PRESET_SCENARIOS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    setSelectedPresetId(preset.id);
                    setResult(null);
                    setError(null);
                  }}
                  className={`p-3 rounded-lg border text-left transition-all space-y-1.5 ${
                    selectedPresetId === preset.id
                      ? "bg-surface-elevated border-signal shadow-panel"
                      : "bg-surface/60 border-surface-border hover:bg-surface hover:border-surface-border/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-text-primary truncate">
                      {preset.name.split(":")[0]}
                    </span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${preset.badgeColor}`}
                    >
                      {preset.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-secondary line-clamp-2 leading-relaxed">
                    {preset.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Scenario Details Box */}
          <div className="bg-surface-elevated rounded-lg p-3.5 border border-surface-border space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between text-[11px] text-text-muted pb-2 border-b border-surface-border/60">
              <span className="font-semibold text-text-primary flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-signal" />
                <span>Simulated Deployment Input Payload</span>
              </span>
              <span>Target: {currentPreset.payload.service} ({currentPreset.payload.environment})</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-text-muted block text-[10px]">Commit Message:</span>
                <span className="text-text-primary font-sans font-medium">
                  {currentPreset.payload.evidence.commitMessage}
                </span>
              </div>
              <div>
                <span className="text-text-muted block text-[10px]">Database Architecture:</span>
                <span className="text-signal">
                  {currentPreset.payload.environmentContext.databaseType} v{currentPreset.payload.environmentContext.databaseVersion} • Pool Size {currentPreset.payload.environmentContext.poolSize}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleRunSimulation}
                disabled={isLoading}
                className="px-4 py-2 rounded bg-signal hover:bg-signal-hover text-canvas font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-panel disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Evaluating Risk Engine & Memory...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Live Pre-Flight Assessment</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded bg-risk-critical/15 border border-risk-critical/40 text-risk-critical text-xs font-mono">
              Simulation Error: {error}
            </div>
          )}

          {/* Simulation Output Card */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface rounded-lg p-4 border border-surface-border space-y-4 shadow-panel"
            >
              <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-text-primary uppercase">
                    Risk Engine Result:
                  </span>
                  <RiskBadge classification={result.riskClassification || result.overallRisk || "NOMINAL"} />
                </div>
                <div className="text-xs font-mono text-text-muted">
                  Score: <strong className="text-text-primary text-sm">{result.riskScore ?? 45} / 100</strong>
                </div>
              </div>

              {/* In Plain English Breakdown for Students */}
              <div className="bg-surface-elevated/70 p-3 rounded border border-signal/30 text-xs space-y-1">
                <span className="text-[10px] font-mono text-signal font-semibold uppercase flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Student Explanation (What this verdict means):</span>
                </span>
                <p className="text-text-primary font-sans leading-relaxed">
                  {result.explanation ||
                    result.summary ||
                    "ReleaseTrace compared the incoming schema changes and database lock characteristics against active deterministic rules and historical post-mortems."}
                </p>
              </div>

              {/* Grounded Mitigations & Checklist */}
              {result.recommendations && result.recommendations.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-text-muted block font-semibold">
                    Actionable CI Safety Checklist:
                  </span>
                  <ul className="space-y-1.5 text-xs font-mono">
                    {result.recommendations.map((rec: any, idx: number) => (
                      <li
                        key={idx}
                        className="p-2 rounded bg-surface-elevated border border-surface-border flex items-start gap-2"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-sage shrink-0 mt-0.5" />
                        <span className="text-text-secondary">{rec.action || rec.item || String(rec)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recalled Memories */}
              {result.recalledMemories && result.recalledMemories.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-signal block font-semibold flex items-center gap-1.5">
                    <BrainCircuit className="w-3.5 h-3.5" />
                    <span>Recalled Precedent From Hindsight Cloud:</span>
                  </span>
                  {result.recalledMemories.map((mem: any, i: number) => (
                    <div
                      key={i}
                      className="p-2.5 rounded bg-surface-elevated border border-signal/20 text-xs font-mono text-text-secondary space-y-1"
                    >
                      <div className="flex justify-between text-text-primary font-semibold">
                        <span>{mem.title || mem.memoryId}</span>
                        <span className="text-signal text-[10px]">
                          Similarity: {((mem.similarityScore || 0.85) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-[11px] text-text-muted font-sans">
                        Root cause: {mem.confirmedRootCause || mem.rootCause}
                      </p>
                      <p className="text-[11px] text-sage font-sans">
                        Mitigation: {mem.verifiedMitigation || mem.resolution}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-surface-border bg-surface-elevated flex items-center justify-between font-mono text-xs">
          <span className="text-text-muted text-[11px]">
            Uses real `/api/assess` Intelligence Engine & Groq LLM
          </span>
          <button
            onClick={() => setIsSimulatorModalOpen(false)}
            className="px-3 py-1.5 rounded bg-surface hover:bg-surface-elevated text-text-secondary border border-surface-border transition-colors"
          >
            Close Sandbox
          </button>
        </div>
      </motion.div>
    </div>
  );
}
