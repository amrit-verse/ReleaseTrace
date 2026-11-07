"use client";

import React, { useEffect, useState } from "react";
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
import { PlainEnglishCallout } from "@/components/ui/PlainEnglishCallout";
import { useDevOpsGuide } from "@/context/DevOpsGuideContext";
import {
  fadeInVariants,
  hoverSubtle,
  tapSubtle,
} from "@/lib/motion";

export default function DeploymentDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const sampleDeployment = mockDeployments.find((item) => item.id === id);

  // Keep the known sample report as an explicit demo route. Real IDs must load real records.
  return sampleDeployment
    ? <MockDeploymentDetailPage deployment={sampleDeployment} />
    : <LiveDeploymentDetail id={id} />;
}

function MockDeploymentDetailPage({ deployment }: { deployment: (typeof mockDeployments)[number] }) {
  const { success, warning, info } = useToast();
  const { setIsFlowModalOpen } = useDevOpsGuide();

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

      <PlainEnglishCallout
        title="Understanding a Pre-Flight Assessment Report"
        analogy="Think of this as an automated airport pre-flight safety inspection. Before a plane takes off, mechanics inspect the engines, verify fuel balance, check past incident records for that aircraft model, and sign off on a pre-flight checklist. ReleaseTrace does this for your code and database."
        explanation="When a pull request triggers CI, ReleaseTrace parses the Git diff, Prisma migrations, and environment variables. It compares configuration parity between preview and production, recalls matching historical post-mortems from Vectorize Hindsight, and runs deterministic safety rules to assign a risk index (0 to 100)."
        whyItMatters="Without pre-flight intelligence, teams discover database deadlocks, connection pool starvation, and missing indexes in production when customers complain. This report gives engineers the exact reasons and actionable remediation steps before merging."
        keyTerms={["Risk Score (0-100)", "Deterministic Safety Rules", "Environment Parity Gap", "Actionable Pre-Flight Gates"]}
        suggestedAction={{
          label: "View 5-stage pipeline flow",
          onClick: () => setIsFlowModalOpen(true),
        }}
      />

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



type LiveDeploymentRecord = {
  id: string; provider: string; providerDeploymentId: string; commitSha: string;
  branch: string; environment: string; status: string; url: string | null;
  startedAt: string; completedAt: string | null; createdAt: string; evidence: unknown;
  project: { name: string; repository: string };
  assessment: null | {
    overallCategory: string; summary: string; groundedExplanation: string;
    recommendedAction: string; llmModel: string; llmDurationMs: number;
    fallbackUsed: boolean; findings: unknown; environmentComparison: unknown;
    checklist: unknown;
    memoryReferences: Array<{ id: string; externalMemoryId: string; relevanceScore: number | null; snippet: string }>;
  };
  resolution: null | {
    engineerName: string; confirmedRootCause: string; appliedFix: string;
    preventionGuideline: string; outcome: string; retainedToHindsight: boolean;
    hindsightMemoryId: string | null; resolvedAt: string;
  };
};

function formatRecordDate(value: string | null | undefined) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not recorded"
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function JsonEvidence({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <p className="text-sm text-text-muted">No evidence was recorded for this field.</p>;
  }
  return (
    <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-surface-border bg-surface-subtle p-4 text-xs leading-relaxed text-text-secondary">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function LiveDeploymentDetail({ id }: { id: string }) {
  const [deployment, setDeployment] = useState<LiveDeploymentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetch(`/api/deployments/${encodeURIComponent(id)}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || `Could not load deployment (HTTP ${response.status})`);
        return payload.deployment as LiveDeploymentRecord;
      })
      .then(setDeployment)
      .catch((cause: unknown) => {
        if (cause instanceof Error && cause.name === "AbortError") return;
        setError(cause instanceof Error ? cause.message : "Could not load this deployment.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 font-sans lg:p-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-text-muted">
        <Link href="/deployments" className="inline-flex items-center gap-1 hover:text-text-primary">
          <ArrowLeft className="h-3.5 w-3.5" /> Deployments
        </Link>
        <span>/</span><span className="font-mono">{id}</span>
      </nav>

      {loading && <section className="rounded-xl border border-surface-border bg-surface p-8 text-sm text-text-secondary">Loading the recorded deployment from the project database…</section>}

      {!loading && error && (
        <section role="alert" className="space-y-3 rounded-xl border border-risk-critical/30 bg-risk-critical/5 p-6">
          <h1 className="text-lg font-semibold text-text-primary">Deployment unavailable</h1>
          <p className="text-sm text-text-secondary">{error}</p>
          <p className="text-xs text-text-muted">This ID was not replaced with a sample record. Check the deployment ID and project database connection.</p>
          <Link href="/deployments" className="inline-flex items-center gap-2 text-sm font-semibold text-signal hover:underline">
            <ArrowLeft className="h-4 w-4" /> Return to deployment register
          </Link>
        </section>
      )}

      {!loading && deployment && (
        <>
          <header className="space-y-4 rounded-xl border border-surface-border bg-surface p-5 shadow-panel">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-text-muted">{deployment.project.name}</p>
                <h1 className="mt-1 text-xl font-semibold text-text-primary">Deployment details</h1>
                <p className="mt-1 break-all font-mono text-xs text-text-muted">{deployment.id}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-surface-border bg-surface-subtle px-3 py-1 text-xs font-semibold uppercase text-text-secondary">{deployment.status.replaceAll("_", " ")}</span>
                {deployment.assessment?.overallCategory && <span className="rounded-full border border-surface-border bg-surface-subtle px-3 py-1 text-xs font-semibold uppercase text-text-primary">{deployment.assessment.overallCategory}</span>}
              </div>
            </div>
            <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div><p className="text-xs text-text-muted">Provider</p><p className="mt-1 font-medium text-text-primary">{deployment.provider}</p></div>
              <div><p className="text-xs text-text-muted">Environment</p><p className="mt-1 font-medium text-text-primary">{deployment.environment}</p></div>
              <div><p className="text-xs text-text-muted">Branch</p><p className="mt-1 break-all font-mono text-xs text-text-primary">{deployment.branch || "Unknown"}</p></div>
              <div><p className="text-xs text-text-muted">Started</p><p className="mt-1 text-text-primary">{formatRecordDate(deployment.startedAt)}</p></div>
            </div>
            <div className="flex flex-wrap items-center gap-3 border-t border-surface-border pt-4">
              {deployment.url ? <a href={deployment.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-signal hover:underline">Open provider deployment <ExternalLink className="h-4 w-4" /></a> : <span className="text-xs text-text-muted">No provider deployment URL was recorded.</span>}
              <span className="break-all font-mono text-xs text-text-muted">Commit {deployment.commitSha}</span>
            </div>
          </header>

          <section className="rounded-xl border border-surface-border bg-surface p-5 shadow-panel">
            <h2 className="text-base font-semibold text-text-primary">Persisted risk assessment</h2>
            {deployment.assessment ? (
              <div className="mt-4 space-y-4">
                <div><p className="text-xs uppercase tracking-wider text-text-muted">Assessment summary</p><p className="mt-1 text-sm leading-relaxed text-text-primary">{deployment.assessment.summary}</p></div>
                <div><p className="text-xs uppercase tracking-wider text-text-muted">Grounded explanation</p><p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">{deployment.assessment.groundedExplanation || "No grounded explanation was persisted."}</p></div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-surface-subtle p-3"><p className="text-xs text-text-muted">Recommended action</p><p className="mt-1 text-sm font-semibold text-text-primary">{deployment.assessment.recommendedAction}</p></div>
                  <div className="rounded-lg bg-surface-subtle p-3"><p className="text-xs text-text-muted">LLM model</p><p className="mt-1 break-all text-xs text-text-primary">{deployment.assessment.llmModel}</p></div>
                  <div className="rounded-lg bg-surface-subtle p-3"><p className="text-xs text-text-muted">Evaluation time</p><p className="mt-1 text-sm text-text-primary">{deployment.assessment.llmDurationMs} ms</p></div>
                </div>
                <div><h3 className="mb-2 text-sm font-semibold text-text-primary">Rule findings</h3><JsonEvidence value={deployment.assessment.findings} /></div>
                <div><h3 className="mb-2 text-sm font-semibold text-text-primary">Environment comparison</h3><JsonEvidence value={deployment.assessment.environmentComparison} /></div>
                <div><h3 className="mb-2 text-sm font-semibold text-text-primary">Assessment checklist</h3><JsonEvidence value={deployment.assessment.checklist} /></div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-text-primary">Hindsight memory references ({deployment.assessment.memoryReferences.length})</h3>
                  {deployment.assessment.memoryReferences.length === 0 ? <p className="text-sm text-text-muted">No historical memory references were attached to this assessment.</p> : (
                    <div className="space-y-2">
                      {deployment.assessment.memoryReferences.map((memory) => (
                        <article key={memory.id} className="rounded-lg border border-surface-border bg-surface-subtle p-3">
                          <p className="break-all font-mono text-xs text-text-primary">{memory.externalMemoryId}</p>
                          <p className="mt-1 text-sm text-text-secondary">{memory.snippet}</p>
                          <p className="mt-1 text-xs text-text-muted">Relevance: {memory.relevanceScore === null ? "Not recorded" : memory.relevanceScore.toFixed(2)}</p>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : <p className="mt-3 text-sm text-text-muted">No assessment has been persisted for this deployment yet.</p>}
          </section>

          <section className="rounded-xl border border-surface-border bg-surface p-5 shadow-panel">
            <h2 className="text-base font-semibold text-text-primary">Deployment evidence</h2>
            <div className="mt-3"><JsonEvidence value={deployment.evidence} /></div>
          </section>

          <section className="rounded-xl border border-surface-border bg-surface p-5 shadow-panel">
            <h2 className="text-base font-semibold text-text-primary">Engineer resolution</h2>
            {deployment.resolution ? (
              <div className="mt-3 space-y-2 text-sm text-text-secondary">
                <p><span className="text-text-muted">Engineer:</span> {deployment.resolution.engineerName}</p>
                <p><span className="text-text-muted">Outcome:</span> {deployment.resolution.outcome}</p>
                <p><span className="text-text-muted">Root cause:</span> {deployment.resolution.confirmedRootCause}</p>
                <p><span className="text-text-muted">Applied fix:</span> {deployment.resolution.appliedFix}</p>
                <p><span className="text-text-muted">Prevention:</span> {deployment.resolution.preventionGuideline}</p>
                <p className="text-xs text-text-muted">Resolved {formatRecordDate(deployment.resolution.resolvedAt)} · Hindsight retained: {deployment.resolution.retainedToHindsight ? "Yes" : "No"}</p>
              </div>
            ) : <p className="mt-3 text-sm text-text-muted">No engineer resolution has been recorded for this deployment.</p>}
          </section>

          <p className="rounded-lg border border-surface-border bg-surface-subtle p-3 text-xs leading-relaxed text-text-muted">This is a read-only view of the persisted deployment and assessment. ReleaseTrace does not perform rollback or change a production deployment from this page.</p>
        </>
      )}
    </div>
  );
}
