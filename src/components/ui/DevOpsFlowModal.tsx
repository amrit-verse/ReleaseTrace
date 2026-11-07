"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import {
  X,
  GitCommit,
  Database,
  BrainCircuit,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Info,
  Zap,
} from "lucide-react";
import { useDevOpsGuide } from "@/context/DevOpsGuideContext";

interface StepDetails {
  id: number;
  name: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  simpleExplanation: string;
  technicalDetails: string;
  sampleInput: string;
  sampleOutput: string;
  proTip: string;
}

const FLOW_STEPS: StepDetails[] = [
  {
    id: 1,
    name: "1. Code Commit & Pull Request Ingestion",
    shortLabel: "Git Push / PR",
    icon: GitCommit,
    color: "text-signal border-signal/40 bg-signal/15",
    simpleExplanation:
      "When a software engineer commits code or opens a GitHub Pull Request, GitHub Actions dispatches a signed webhook event to ReleaseTrace.",
    technicalDetails:
      "Payload is cryptographically verified via HMAC SHA-256 (`x-releasetrace-signature`). Stored in Neon PostgreSQL with durable idempotency to prevent duplicate runs.",
    sampleInput: `{\n  "eventId": "evt_gh_98412",\n  "commitSha": "aae1a03",\n  "branch": "feat/billing",\n  "changedFiles": ["prisma/schema.prisma", "src/billing.ts"]\n}`,
    sampleOutput: `{\n  "accepted": true,\n  "status": "queued_for_assessment",\n  "inngestEventIds": ["01M6T70N92Q..."]\n}`,
    proTip: "Never deploy blind. Every deployment starts with signed, tamper-proof Git provenance.",
  },
  {
    id: 2,
    name: "2. Deep Telemetry & Schema Migration Extraction",
    shortLabel: "Schema & Telemetry",
    icon: Database,
    color: "text-sage border-sage/40 bg-sage/15",
    simpleExplanation:
      "ReleaseTrace inspects the code diff, checking if database tables are altered, indexes are created without concurrent locks, or connection pool sizes are too small.",
    technicalDetails:
      "Computes SHA-256 schema hashes, parses Prisma migration SQL AST, and compares staging vs production environment parity (connection pools, replicas, region).",
    sampleInput: `ALTER TABLE "subscriptions" ADD COLUMN "plan_tier" TEXT NOT NULL;`,
    sampleOutput: `{\n  "hasPendingMigrations": true,\n  "lockRisk": "EXCLUSIVE_TABLE_LOCK",\n  "databaseVersion": "17",\n  "poolSize": 10\n}`,
    proTip: "Adding a NOT NULL column without a default locks entire Postgres tables, causing instant downtime on live traffic.",
  },
  {
    id: 3,
    name: "3. Persistent Hindsight Memory Recall",
    shortLabel: "Hindsight Memory",
    icon: BrainCircuit,
    color: "text-signal border-signal/40 bg-signal/15",
    simpleExplanation:
      "Unlike dumb static linters, ReleaseTrace queries Vectorize Hindsight Cloud to ask: 'Has this exact pattern ever crashed our servers in past post-mortems?'",
    technicalDetails:
      "Performs semantic retrieval against the project's isolated bank (`rt-proj_releasetrace_core`). Matches error signatures, database versions, and root causes.",
    sampleInput: `Query: "PostgreSQL pool size 10 during migration table lock"`,
    sampleOutput: `{\n  "memoryId": "mem_pg_pool_exhaustion",\n  "confirmedRootCause": "Pool 10 exhausted during concurrent lock",\n  "verifiedMitigation": "Scale connection pool to 25 before deploying"\n}`,
    proTip: "Hindsight turns past 3 AM outages into permanently retained release immunity.",
  },
  {
    id: 4,
    name: "4. Deterministic Risk Rules + Groq LLM Reasoning",
    shortLabel: "Rules & LLM",
    icon: ShieldAlert,
    color: "text-risk-critical border-risk-critical/40 bg-risk-critical/15",
    simpleExplanation:
      "Deterministic safety rules first verify baseline invariant floors. Then Groq LLM synthesizes current telemetry + recalled past lessons into an actionable checklist.",
    technicalDetails:
      "Evaluates 8 deterministic risk rules (RT-RULE-001 through 008). Zod schemas strictly validate output structure to eliminate LLM hallucinations.",
    sampleInput: `Evidence + Recalled Incident Precedent`,
    sampleOutput: `{\n  "riskClassification": "HIGH",\n  "riskScore": 82,\n  "recommendedAction": "PROCEED_WITH_CHECKLIST",\n  "groundedMitigation": "Scale pool to 25 and set pool acquire timeout to 5000ms"\n}`,
    proTip: "Never let AI guess ungrounded advice. ReleaseTrace grounds every mitigation in verified engineering precedent.",
  },
  {
    id: 5,
    name: "5. Pre-Flight Gate Verdict & Human Decision",
    shortLabel: "CI Gate Decision",
    icon: ShieldCheck,
    color: "text-sage border-sage/40 bg-sage/15",
    simpleExplanation:
      "If risk is CRITICAL or HIGH, the CI pipeline is halted before production users are affected. The engineer reviews the checklist and signs off with cryptographic authorization.",
    technicalDetails:
      "Passes or blocks the GitHub Actions step. Human confirmation with Bearer authorization retains new post-deploy incident knowledge back into Hindsight.",
    sampleInput: `Engineer signs off: "Pool scaled to 25. Runbook #4102 executed."`,
    sampleOutput: `Deployment unblocked → Alias promoted → 0 Downtime Recorded`,
    proTip: "The AI informs and recalls. The evidence verifies. The human engineer decides.",
  },
];

export function DevOpsFlowModal() {
  const { isFlowModalOpen, setIsFlowModalOpen, setIsSimulatorModalOpen } = useDevOpsGuide();
  const [selectedStepId, setSelectedStepId] = useState<number>(1);

  if (!isFlowModalOpen) return null;

  const currentStep = FLOW_STEPS.find((s) => s.id === selectedStepId) || FLOW_STEPS[0];
  const StepIcon = currentStep.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => setIsFlowModalOpen(false)}
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative z-10 w-full max-w-4xl bg-surface border border-surface-border rounded-xl shadow-2xl overflow-hidden font-sans flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-border bg-surface-elevated">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-signal/15 text-signal border border-signal/30 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text-primary">
                How ReleaseTrace Works: The End-to-End Release Safety Journey
              </h2>
              <p className="text-xs text-text-muted font-mono">
                Click any stage below to inspect how your code travels safely from commit to production.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsFlowModalOpen(false)}
            className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-surface transition-colors"
            aria-label="Close flow modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 5-Step Visual Stepper Bar */}
        <div className="p-4 bg-canvas/40 border-b border-surface-border overflow-x-auto">
          <div className="flex items-center justify-between min-w-[600px] gap-2">
            {FLOW_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isSelected = step.id === selectedStepId;
              return (
                <React.Fragment key={step.id}>
                  <button
                    onClick={() => setSelectedStepId(step.id)}
                    className={`flex-1 p-2.5 rounded-lg border text-left transition-all flex items-center gap-2.5 ${
                      isSelected
                        ? "bg-surface-elevated border-signal shadow-panel"
                        : "bg-surface/60 border-surface-border hover:bg-surface hover:border-surface-border/80"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded flex items-center justify-center shrink-0 border ${step.color}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono text-text-muted uppercase block leading-tight">
                        Stage {step.id}
                      </span>
                      <span
                        className={`text-xs font-semibold truncate block ${
                          isSelected ? "text-signal" : "text-text-secondary"
                        }`}
                      >
                        {step.shortLabel}
                      </span>
                    </div>
                  </button>

                  {idx < FLOW_STEPS.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-text-muted shrink-0 opacity-40" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Step Detail Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${currentStep.color}`}>
              <StepIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">{currentStep.name}</h3>
              <p className="text-xs text-text-secondary mt-0.5">{currentStep.simpleExplanation}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Technical Mechanism */}
            <div className="bg-surface-elevated rounded-lg p-3.5 border border-surface-border space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-signal font-semibold block">
                Technical Mechanism Under The Hood
              </span>
              <p className="text-xs text-text-primary leading-relaxed">
                {currentStep.technicalDetails}
              </p>
              <div className="pt-2 border-t border-surface-border/60">
                <div className="flex items-start gap-1.5 text-[11px] text-sage">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    <strong>DevOps Pro Tip:</strong> {currentStep.proTip}
                  </span>
                </div>
              </div>
            </div>

            {/* Input / Output Preview */}
            <div className="bg-surface-elevated rounded-lg p-3.5 border border-surface-border space-y-2 font-mono text-[11px]">
              <div className="flex items-center justify-between text-[10px] text-text-muted">
                <span className="uppercase tracking-wider">Observed I/O Pipeline Trace</span>
                <span className="text-sage flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Verified Contract</span>
                </span>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-text-muted text-[10px] block">Incoming Input:</span>
                  <pre className="bg-canvas p-2 rounded text-text-secondary text-[10px] overflow-x-auto max-h-24">
                    {currentStep.sampleInput}
                  </pre>
                </div>
                <div>
                  <span className="text-text-muted text-[10px] block">Computed Output:</span>
                  <pre className="bg-canvas p-2 rounded text-signal text-[10px] overflow-x-auto max-h-24">
                    {currentStep.sampleOutput}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-surface-border bg-surface-elevated flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedStepId((prev) => (prev > 1 ? prev - 1 : 5))}
              className="px-3 py-1.5 rounded bg-surface hover:bg-surface-elevated text-text-secondary border border-surface-border transition-colors"
            >
              ← Previous Stage
            </button>
            <button
              onClick={() => setSelectedStepId((prev) => (prev < 5 ? prev + 1 : 1))}
              className="px-3 py-1.5 rounded bg-surface-elevated hover:bg-surface text-signal border border-signal/40 transition-colors"
            >
              Next Stage →
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsFlowModalOpen(false);
                setIsSimulatorModalOpen(true);
              }}
              className="px-3 py-1.5 rounded bg-signal hover:bg-signal-hover text-canvas font-semibold transition-colors flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Try Live in Simulator</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
