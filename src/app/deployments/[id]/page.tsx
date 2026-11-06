"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import {
  GitCommit,
  GitPullRequest,
  Server,
  ShieldAlert,
  BrainCircuit,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Layers,
  ChevronRight,
  Activity,
  Check,
} from "lucide-react";
import { mockDeployments } from "@/data/mockData";
import { RiskBadge, StatusBadge } from "@/components/ui/StatusBadge";
import { RiskGauge } from "@/components/ui/RiskGauge";
import { EnvironmentComparisonCard } from "@/components/ui/EnvironmentComparisonCard";
import { EvidenceCard } from "@/components/ui/EvidenceCard";
import { HindsightMemoryCard } from "@/components/ui/HindsightMemoryCard";
import { VerificationChecklist } from "@/components/ui/VerificationChecklist";

export default function DeploymentDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const deployment = mockDeployments.find((d) => d.id === id) || mockDeployments[0];

  const [activeTab, setActiveTab] = useState<"overview" | "evidence" | "environment" | "memories" | "actions">("overview");
  const [pipelineState, setPipelineState] = useState(deployment.status);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const rerunAssessment = () => {
    setIsEvaluating(true);
    showToast("Re-evaluating release payload against active Hindsight memory bank...");
    setTimeout(() => {
      setIsEvaluating(false);
      showToast("Evaluation complete: Risk verified at " + deployment.riskScore + "/100");
    }, 1200);
  };

  const handleRollback = () => {
    setPipelineState("rolled_back");
    showToast(`Emergency rollback triggered for ${deployment.service}. Restoring previous cluster revision.`);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto w-full font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-surface border border-brand-hindsight/60 text-zinc-100 px-4 py-3 rounded-lg shadow-technical-md font-mono text-xs flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-xs font-mono text-zinc-500">
        <Link href="/deployments" className="hover:text-zinc-300 flex items-center space-x-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Deployments</span>
        </Link>
        <span>/</span>
        <span className="text-zinc-300">{deployment.id}</span>
        <span>/</span>
        <span className="text-zinc-400">{deployment.service}</span>
      </div>

      {/* Main Header Card */}
      <div className="bg-surface border border-surface-border rounded-lg p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-surface-border">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold text-zinc-100">
                {deployment.service}
              </span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-subtle text-zinc-400 border border-surface-border">
                {deployment.version}
              </span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-subtle text-zinc-300 border border-surface-border">
                {deployment.environment.toUpperCase()}
              </span>
              <StatusBadge status={pipelineState} />
            </div>

            <h1 className="text-base font-semibold text-zinc-200">
              {deployment.commitMessage}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-400 pt-1">
              <div className="flex items-center space-x-1.5">
                <GitCommit className="w-3.5 h-3.5 text-zinc-500" />
                <span>{deployment.commitHash}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <GitPullRequest className="w-3.5 h-3.5 text-zinc-500" />
                <a
                  href={deployment.pullRequest.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-hindsight hover:underline inline-flex items-center gap-1"
                >
                  <span>PR #{deployment.pullRequest.number}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div>Author: {deployment.author.name}</div>
              <div>Cluster: {deployment.targetCluster}</div>
              <div>{new Date(deployment.timestamp).toLocaleString()}</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <button
              onClick={rerunAssessment}
              disabled={isEvaluating}
              className="px-3 py-2 rounded bg-surface-subtle hover:bg-surface-border text-zinc-200 border border-surface-border flex items-center space-x-1.5 transition-colors"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isEvaluating ? "animate-spin text-purple-400" : ""}`} />
              <span>{isEvaluating ? "EVALUATING..." : "RE-ASSESS"}</span>
            </button>

            {pipelineState === "blocked" && (
              <button
                onClick={handleRollback}
                className="px-3 py-2 rounded bg-red-950/70 hover:bg-red-900/60 text-red-300 border border-red-800 flex items-center space-x-1.5 transition-colors"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>TRIGGER ROLLBACK</span>
              </button>
            )}
          </div>
        </div>

        {/* Telemetry Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
          <div className="bg-surface-subtle p-2.5 rounded border border-surface-border">
            <span className="text-zinc-500 text-[10px] block">BUILD TIME</span>
            <span className="text-zinc-200 font-semibold">{deployment.telemetry.buildTimeSec}s</span>
          </div>
          <div className="bg-surface-subtle p-2.5 rounded border border-surface-border">
            <span className="text-zinc-500 text-[10px] block">CHANGED FILES</span>
            <span className="text-zinc-200 font-semibold">{deployment.telemetry.changedFilesCount} files</span>
          </div>
          <div className="bg-surface-subtle p-2.5 rounded border border-surface-border">
            <span className="text-zinc-500 text-[10px] block">LINES DIFF</span>
            <span className="text-emerald-400">+{deployment.telemetry.addedLines}</span> /{" "}
            <span className="text-red-400">-{deployment.telemetry.deletedLines}</span>
          </div>
          <div className="bg-surface-subtle p-2.5 rounded border border-surface-border">
            <span className="text-zinc-500 text-[10px] block">DB MIGRATIONS</span>
            <span className={deployment.telemetry.databaseMigrations > 0 ? "text-amber-400 font-semibold" : "text-zinc-200"}>
              {deployment.telemetry.databaseMigrations} schema files
            </span>
          </div>
          <div className="bg-surface-subtle p-2.5 rounded border border-surface-border">
            <span className="text-zinc-500 text-[10px] block">TEST COVERAGE</span>
            <span className="text-zinc-200 font-semibold">{deployment.telemetry.testCoveragePct}%</span>
          </div>
          <div className="bg-surface-subtle p-2.5 rounded border border-surface-border">
            <span className="text-zinc-500 text-[10px] block">P99 LATENCY TARGET</span>
            <span className="text-zinc-200 font-semibold">{deployment.telemetry.p99LatencyMsTarget}ms</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-surface-border flex space-x-6 text-xs font-mono">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-2.5 font-medium transition-colors border-b-2 flex items-center space-x-1.5 ${
            activeTab === "overview"
              ? "border-brand-hindsight text-white"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Risk Assessment & Recommendations</span>
        </button>

        <button
          onClick={() => setActiveTab("evidence")}
          className={`pb-2.5 font-medium transition-colors border-b-2 flex items-center space-x-1.5 ${
            activeTab === "evidence"
              ? "border-brand-hindsight text-white"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Telemetry Evidence ({deployment.evidence.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("environment")}
          className={`pb-2.5 font-medium transition-colors border-b-2 flex items-center space-x-1.5 ${
            activeTab === "environment"
              ? "border-brand-hindsight text-white"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>Environment Parity & Mismatches ({deployment.environmentComparison.mismatches.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("memories")}
          className={`pb-2.5 font-medium transition-colors border-b-2 flex items-center space-x-1.5 ${
            activeTab === "memories"
              ? "border-brand-hindsight text-white"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <BrainCircuit className="w-3.5 h-3.5" />
          <span>Hindsight Recall ({deployment.recalledMemories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("actions")}
          className={`pb-2.5 font-medium transition-colors border-b-2 flex items-center space-x-1.5 ${
            activeTab === "actions"
              ? "border-brand-hindsight text-white"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Verification Gates ({deployment.verificationActions.length})</span>
        </button>
      </div>

      {/* Tab 1: Overview & Risk Assessment */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Recommendation Reasons Behind Flagging */}
            <div className="bg-surface border border-surface-border rounded-lg p-5 space-y-4">
              <div className="flex items-center space-x-2 border-b border-surface-border pb-3">
                <ShieldAlert className="w-4 h-4 text-brand-hindsight" />
                <h3 className="text-sm font-semibold text-zinc-100">
                  Reasons Behind Assessment & Gating Decision
                </h3>
              </div>

              <ul className="space-y-2.5 text-xs text-zinc-300 font-sans">
                {deployment.recommendationReasons.map((reason, idx) => (
                  <li
                    key={idx}
                    className="flex items-start space-x-2.5 p-3 rounded bg-surface-subtle border border-surface-border/60"
                  >
                    <span className="font-mono text-purple-400 font-bold select-none pt-0.5">
                      0{idx + 1}
                    </span>
                    <span className="leading-relaxed">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick Evidence Preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-100">
                  Critical Deployment Evidence
                </h3>
                <button
                  onClick={() => setActiveTab("evidence")}
                  className="text-xs font-mono text-brand-hindsight hover:underline"
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
                  <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4 text-brand-hindsight" />
                    <span>Top Recalled Hindsight Memory</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab("memories")}
                    className="text-xs font-mono text-brand-hindsight hover:underline"
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
                <h3 className="text-sm font-semibold text-zinc-100">
                  Required Engineer Gates
                </h3>
                <button
                  onClick={() => setActiveTab("actions")}
                  className="text-xs font-mono text-brand-hindsight hover:underline"
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
        </div>
      )}

      {/* Tab 2: Telemetry Evidence */}
      {activeTab === "evidence" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-100">
              Complete Pre-Flight Telemetry & Code Evidence
            </h3>
            <span className="text-xs font-mono text-zinc-400">
              Scanned across git commits, SQL migrations, container specs, and network topologies
            </span>
          </div>
          <EvidenceCard evidence={deployment.evidence} />
        </div>
      )}

      {/* Tab 3: Environment Comparison & Mismatches */}
      {activeTab === "environment" && (
        <div className="space-y-4">
          <EnvironmentComparisonCard comparison={deployment.environmentComparison} />
        </div>
      )}

      {/* Tab 4: Recalled Hindsight Memories */}
      {activeTab === "memories" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">
                Hindsight Historical Memory Recalls ({deployment.recalledMemories.length})
              </h3>
              <p className="text-xs font-mono text-zinc-500">
                Incidents with high semantic & structural similarity recalled from memory bank
              </p>
            </div>
            <span className="text-xs font-mono text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800">
              Vectorize Hindsight Engine Connected
            </span>
          </div>

          {deployment.recalledMemories.length === 0 ? (
            <div className="bg-surface border border-surface-border rounded-lg p-8 text-center text-zinc-500 font-mono text-xs">
              Zero historical incidents matched this release profile.
            </div>
          ) : (
            <div className="space-y-4">
              {deployment.recalledMemories.map((mem) => (
                <HindsightMemoryCard key={mem.id} memory={mem} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Verification Checklist */}
      {activeTab === "actions" && (
        <div className="space-y-4">
          <VerificationChecklist
            initialActions={deployment.verificationActions}
            deploymentId={deployment.id}
          />
        </div>
      )}
    </div>
  );
}
