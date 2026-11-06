"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  GitCommit,
  GitPullRequest,
  Server,
  ShieldAlert,
  BrainCircuit,
  FileCode,
  CheckCircle2,
  ArrowLeft,
  ExternalLink,
  RotateCcw,
  Activity,
  Database,
} from "lucide-react";
import { mockDeployments } from "@/data/mockData";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RiskGauge } from "@/components/ui/RiskGauge";
import { EnvironmentComparisonCard } from "@/components/ui/EnvironmentComparisonCard";
import { EvidenceCard } from "@/components/ui/EvidenceCard";
import { HindsightMemoryCard } from "@/components/ui/HindsightMemoryCard";
import { VerificationChecklist } from "@/components/ui/VerificationChecklist";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";
import {
  fadeInVariants,
  hoverSubtle,
  tapSubtle,
} from "@/lib/motion";

export default function DeploymentDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { success, warning, info } = useToast();

  const deployment = mockDeployments.find((d) => d.id === id) || mockDeployments[0];

  const [activeTab, setActiveTab] = useState<"overview" | "evidence" | "environment" | "memories" | "actions">("overview");
  const [pipelineState, setPipelineState] = useState(deployment.status);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [rollbackDialogOpen, setRollbackDialogOpen] = useState(false);

  const rerunAssessment = () => {
    setIsEvaluating(true);
    info("Evaluating Release Payload", "Comparing deployment against active Hindsight bank and Neon schema...");
    setTimeout(() => {
      setIsEvaluating(false);
      success("Evaluation Complete", `Risk index verified at ${deployment.riskScore}/100.`);
    }, 1200);
  };

  const handleRollbackConfirm = () => {
    setPipelineState("rolled_back");
    setRollbackDialogOpen(false);
    warning(
      "Rollback Dispatched",
      `Emergency rollback signaled for ${deployment.service}. Restoring previous Vercel production alias.`
    );
  };

  const tabs = [
    { id: "overview", label: "Risk Assessment & Precedents", icon: Activity, count: null },
    { id: "evidence", label: "Telemetry Evidence", icon: FileCode, count: deployment.evidence.length },
    { id: "environment", label: "Environment Parity", icon: Server, count: deployment.environmentComparison.mismatches.length },
    { id: "memories", label: "Hindsight Recall", icon: BrainCircuit, count: deployment.recalledMemories.length },
    { id: "actions", label: "Verification Gates", icon: CheckCircle2, count: deployment.verificationActions.length },
  ] as const;

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto w-full font-sans">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs font-mono text-text-muted">
        <Link href="/deployments" className="hover:text-text-primary flex items-center space-x-1 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Deployments</span>
        </Link>
        <span>/</span>
        <span className="text-text-secondary">{deployment.id}</span>
        <span>/</span>
        <span className="text-text-primary">{deployment.service}</span>
      </nav>

      {/* Main Header Card */}
      <div className="bg-surface border border-surface-border rounded p-5 space-y-4 shadow-panel">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-surface-border">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold text-text-primary">
                {deployment.service}
              </span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-elevated text-text-muted border border-surface-border">
                {deployment.version}
              </span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-elevated text-text-secondary border border-surface-border">
                {deployment.environment.toUpperCase()}
              </span>
              <StatusBadge status={pipelineState} />
            </div>

            <h1 className="text-base font-semibold text-text-primary">
              {deployment.commitMessage}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-text-muted pt-1">
              <div className="flex items-center space-x-1.5">
                <GitCommit className="w-3.5 h-3.5 text-text-muted" />
                <span className="text-signal/90">{deployment.commitHash.substring(0, 8)}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <GitPullRequest className="w-3.5 h-3.5 text-text-muted" />
                <a
                  href={deployment.pullRequest.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-signal hover:underline inline-flex items-center gap-1"
                >
                  <span>PR #{deployment.pullRequest.number}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div>Author: {deployment.author.name}</div>
              <div className="flex items-center gap-1">
                <Database className="w-3 h-3 text-signal" />
                <span>Target: Vercel / Neon</span>
              </div>
              <div>{new Date(deployment.timestamp).toLocaleString()}</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <motion.button
              whileHover={hoverSubtle}
              whileTap={tapSubtle}
              onClick={rerunAssessment}
              disabled={isEvaluating}
              className="px-3 py-2 rounded bg-surface-elevated hover:bg-surface-elevated/80 text-text-primary border border-surface-border flex items-center space-x-1.5 transition-colors shadow-panel"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isEvaluating ? "animate-spin text-signal" : ""}`} />
              <span>{isEvaluating ? "EVALUATING..." : "RE-ASSESS"}</span>
            </motion.button>

            {pipelineState === "blocked" && (
              <motion.button
                whileHover={hoverSubtle}
                whileTap={tapSubtle}
                onClick={() => setRollbackDialogOpen(true)}
                className="px-3 py-2 rounded bg-risk-critical/20 hover:bg-risk-critical/30 text-risk-critical border border-risk-critical/50 flex items-center space-x-1.5 transition-colors shadow-panel font-semibold"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>TRIGGER ROLLBACK</span>
              </motion.button>
            )}
          </div>
        </div>

        {/* Telemetry Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
          <div className="bg-surface-elevated p-2.5 rounded border border-surface-border">
            <span className="text-text-muted text-[10px] block uppercase tracking-wider">BUILD TIME</span>
            <span className="text-text-primary font-semibold">{deployment.telemetry.buildTimeSec}s</span>
          </div>
          <div className="bg-surface-elevated p-2.5 rounded border border-surface-border">
            <span className="text-text-muted text-[10px] block uppercase tracking-wider">CHANGED FILES</span>
            <span className="text-text-primary font-semibold">{deployment.telemetry.changedFilesCount} files</span>
          </div>
          <div className="bg-surface-elevated p-2.5 rounded border border-surface-border">
            <span className="text-text-muted text-[10px] block uppercase tracking-wider">LINES DIFF</span>
            <span className="text-sage">+{deployment.telemetry.addedLines}</span> /{" "}
            <span className="text-risk-critical">-{deployment.telemetry.deletedLines}</span>
          </div>
          <div className="bg-surface-elevated p-2.5 rounded border border-surface-border">
            <span className="text-text-muted text-[10px] block uppercase tracking-wider">PRISMA SCHEMA</span>
            <span className={deployment.telemetry.databaseMigrations > 0 ? "text-risk-warning font-semibold" : "text-text-primary"}>
              {deployment.telemetry.databaseMigrations} migration file
            </span>
          </div>
          <div className="bg-surface-elevated p-2.5 rounded border border-surface-border">
            <span className="text-text-muted text-[10px] block uppercase tracking-wider">TEST COVERAGE</span>
            <span className="text-text-primary font-semibold">{deployment.telemetry.testCoveragePct}%</span>
          </div>
          <div className="bg-surface-elevated p-2.5 rounded border border-surface-border">
            <span className="text-text-muted text-[10px] block uppercase tracking-wider">P99 LATENCY TARGET</span>
            <span className="text-text-primary font-semibold">{deployment.telemetry.p99LatencyMsTarget}ms</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation with Motion layoutId */}
      <div className="border-b border-surface-border flex space-x-2 sm:space-x-4 text-xs font-mono overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`relative pb-2.5 px-2 font-medium transition-colors flex items-center space-x-1.5 shrink-0 ${
                isActive ? "text-text-primary" : "text-text-muted hover:text-text-secondary"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-signal" : "text-text-muted"}`} />
              <span>
                {tab.label}
                {tab.count !== null ? ` (${tab.count})` : ""}
              </span>
              {isActive && (
                <motion.div
                  layoutId="active-deployment-tab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-signal"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div
            key="tab-overview"
            variants={fadeInVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            <div className="lg:col-span-2 space-y-6">
              {/* Recommendation Reasons Behind Flagging */}
              <div className="bg-surface border border-surface-border rounded p-5 space-y-4 shadow-panel">
                <div className="flex items-center space-x-2 border-b border-surface-border pb-3">
                  <ShieldAlert className="w-4 h-4 text-signal" />
                  <h3 className="text-sm font-semibold text-text-primary">
                    Reasons Behind Assessment & Gating Decision
                  </h3>
                </div>

                <ul className="space-y-2.5 text-xs text-text-secondary font-sans">
                  {deployment.recommendationReasons.map((reason, idx) => (
                    <li
                      key={idx}
                      className="flex items-start space-x-2.5 p-3 rounded bg-surface-elevated border border-surface-border"
                    >
                      <span className="font-mono text-signal font-bold select-none pt-0.5">
                        0{idx + 1}
                      </span>
                      <span className="leading-relaxed text-text-primary">{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quick Evidence Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-text-primary font-mono uppercase tracking-wider">
                    Deployment Evidence Highlight
                  </h3>
                  <button
                    onClick={() => setActiveTab("evidence")}
                    className="text-xs font-mono text-signal hover:underline"
                  >
                    View all ({deployment.evidence.length})
                  </button>
                </div>
                <EvidenceCard evidence={deployment.evidence.slice(0, 2)} />
              </div>

              {/* Recalled Memory Preview */}
              {deployment.recalledMemories.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-text-primary flex items-center gap-2 font-mono uppercase tracking-wider">
                      <BrainCircuit className="w-3.5 h-3.5 text-signal" />
                      <span>Top Recalled Hindsight Memory</span>
                    </h3>
                    <button
                      onClick={() => setActiveTab("memories")}
                      className="text-xs font-mono text-signal hover:underline"
                    >
                      View all ({deployment.recalledMemories.length})
                    </button>
                  </div>
                  <HindsightMemoryCard memory={deployment.recalledMemories[0]} compact={true} />
                </div>
              )}
            </div>

            {/* Right Column: Risk Gauge & Verification Checklist */}
            <div className="space-y-6">
              <RiskGauge
                score={deployment.riskScore}
                classification={deployment.riskClassification}
              />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-text-primary font-mono uppercase tracking-wider">
                    Required Engineer Gates
                  </h3>
                  <button
                    onClick={() => setActiveTab("actions")}
                    className="text-xs font-mono text-signal hover:underline"
                  >
                    Manage
                  </button>
                </div>
                <VerificationChecklist
                  initialActions={deployment.verificationActions}
                  deploymentId={deployment.id}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 2: Telemetry Evidence */}
        {activeTab === "evidence" && (
          <motion.div
            key="tab-evidence"
            variants={fadeInVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">
                Complete Pre-Flight Telemetry & Code Evidence
              </h3>
              <span className="text-xs font-mono text-text-muted">
                Scanned across git commits, SQL migrations, and runtime configs
              </span>
            </div>
            <EvidenceCard evidence={deployment.evidence} />
          </motion.div>
        )}

        {/* Tab 3: Environment Comparison & Mismatches */}
        {activeTab === "environment" && (
          <motion.div
            key="tab-environment"
            variants={fadeInVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-4"
          >
            <EnvironmentComparisonCard comparison={deployment.environmentComparison} />
          </motion.div>
        )}

        {/* Tab 4: Recalled Hindsight Memories */}
        {activeTab === "memories" && (
          <motion.div
            key="tab-memories"
            variants={fadeInVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">
                  Hindsight Historical Memory Recalls ({deployment.recalledMemories.length})
                </h3>
                <p className="text-xs font-mono text-text-muted">
                  Incidents with high semantic & structural similarity recalled from memory bank
                </p>
              </div>
              <span className="text-xs font-mono text-signal bg-signal/15 px-2 py-0.5 rounded border border-signal/30">
                Vectorize Hindsight Connected
              </span>
            </div>

            {deployment.recalledMemories.length === 0 ? (
              <div className="bg-surface border border-surface-border rounded p-8 text-center text-text-muted font-mono text-xs">
                Zero historical incidents matched this release profile.
              </div>
            ) : (
              <div className="space-y-4">
                {deployment.recalledMemories.map((mem) => (
                  <HindsightMemoryCard key={mem.id} memory={mem} />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Tab 5: Verification Checklist */}
        {activeTab === "actions" && (
          <motion.div
            key="tab-actions"
            variants={fadeInVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-4"
          >
            <VerificationChecklist
              initialActions={deployment.verificationActions}
              deploymentId={deployment.id}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rollback Confirmation Dialog */}
      <ConfirmDialog
        isOpen={rollbackDialogOpen}
        title="Confirm Emergency Rollback"
        description={`This will trigger an automated rollback on Vercel for ${deployment.service}, restoring the previous verified production deployment and halting traffic to revision ${deployment.version}.`}
        confirmLabel="Execute Rollback"
        variant="danger"
        onConfirm={handleRollbackConfirm}
        onCancel={() => setRollbackDialogOpen(false)}
      />
    </div>
  );
}

