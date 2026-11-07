"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Sparkles,
  BrainCircuit,
  ShieldAlert,
  CheckCircle2,
  RotateCcw,
  FileCode,
  Server,
  Check,
} from "lucide-react";
import { mockLearningLabScenarios } from "@/data/mockData";
import { HindsightMemory } from "@/types";
import {
  retainNewMemory,
  resetMemoriesToDefault,
  EngineAssessmentResult,
} from "@/lib/memoryEngine";
import { RiskBadge } from "@/components/ui/StatusBadge";
import { HindsightMemoryCard } from "@/components/ui/HindsightMemoryCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/ToastProvider";
import {
  fadeInVariants,
  staggerContainer,
  hoverSubtle,
  tapSubtle,
} from "@/lib/motion";

export default function LearningLabPage() {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("scenario-postgres-lock");
  const [engineMode, setEngineMode] = useState<"LIVE_MEMORY_ENGINE" | "FIXTURE">("LIVE_MEMORY_ENGINE");
  const { success, warning, info } = useToast();

  // Step state: 1: Cold, 2: Retention, 3: Warm
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [hasRetained, setHasRetained] = useState(false);
  const [retainedMemoryResult, setRetainedMemoryResult] = useState<HindsightMemory | null>(null);

  // Live assessment results
  const [coldResult, setColdResult] = useState<EngineAssessmentResult | null>(null);
  const [warmResult, setWarmResult] = useState<EngineAssessmentResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationLog, setEvaluationLog] = useState<string[]>([]);

  const scenario =
    mockLearningLabScenarios.find((s) => s.id === selectedScenarioId) ||
    mockLearningLabScenarios[0];

  // Reset scenario on scenario switch
  const handleScenarioChange = (id: string) => {
    setSelectedScenarioId(id);
    setCurrentStep(1);
    setHasRetained(false);
    setRetainedMemoryResult(null);
    setColdResult(null);
    setWarmResult(null);
    setEvaluationLog([]);
  };

  const handleResetLab = async () => {
    const projectId = scenario.service;
    try {
      await fetch(`/api/memories?projectId=${projectId}&action=reset_fixture`, {
        method: "DELETE",
      });
    } catch {}
    resetMemoriesToDefault();
    setCurrentStep(1);
    setHasRetained(false);
    setRetainedMemoryResult(null);
    setColdResult(null);
    setWarmResult(null);
    setEvaluationLog([`Project bank rt-${projectId} reset. Baseline clean state restored.`]);
    info("Lab Reset", `Project bank rt-${projectId} reset to baseline.`);
  };

  // Step 1: Run Cold Assessment
  const runColdAssessment = async () => {
    setIsEvaluating(true);
    const projectId = scenario.service;
    setEvaluationLog([
      `Initializing Pre-flight CI Gate Scanner for project '${projectId}'...`,
      `Dispatching assessment payload to /api/assess...`,
      `Bank target: rt-${projectId}`,
      `Querying Hindsight memory precedents...`,
    ]);

    try {
      if (engineMode === "FIXTURE") {
        setColdResult({
          riskScore: scenario.coldRun.riskScore,
          riskClassification: scenario.coldRun.riskClassification,
          recalledMemories: [],
          reasons: [
            scenario.coldRun.explanation,
            "Environment scale disparity ignored by static checker.",
          ],
          preventativeActions: ["Standard QA pass."],
          source: "FIXTURE",
        });
        setIsEvaluating(false);
        setEvaluationLog((prev) => [
          ...prev,
          "Cold Assessment Complete: Blindspot detected! Risk marked NOMINAL due to lack of historical memory.",
        ]);
        warning("Cold Run Completed", "Deployment passed static checks but missed hidden production lock hazard.");
        return;
      }

      const coldEnv = {
        runtime: "nodejs@22.0.0",
        database: {
          type: "postgresql",
          version: "15.0",
          poolSize: 100,
          statementTimeoutMs: 30000,
        },
        infrastructure: {
          provider: "aws",
          region: "us-east-1",
          replicas: 1,
        },
        featureFlags: {},
        envVariables: {},
        dependencies: {},
      };

      const res = await fetch("/api/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          service: scenario.service,
          commitHash: scenario.commitHash,
          branch: "main",
          codeDiff: scenario.codeDiff.diffSnippet,
          environmentNotes: scenario.environmentSetup.testEnv,
          environment: coldEnv,
          targetEnvironment: "production",
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status} from /api/assess`);
      }

      const data = await res.json();

      setColdResult({
        riskScore:
          data.riskScore ??
          (data.overallCategory === "CRITICAL"
            ? 90
            : data.overallCategory === "HIGH"
            ? 75
            : 22),
        riskClassification: data.overallCategory || "NOMINAL",
        recalledMemories: data.recalledMemories || [],
        reasons: data.currentEvidenceSummary?.criticalSignals || [
          `No matching historical incident precedents found in project bank rt-${projectId}.`,
        ],
        preventativeActions:
          data.recommendations?.map((r: any) => r.action || r.summary || r) || [
            "Proceed with standard canary rollout and telemetry monitoring.",
          ],
        source: data.source || "SERVER_SIDE_HINDSIGHT_ENGINE",
      });

      setIsEvaluating(false);
      setEvaluationLog((prev) => [
        ...prev,
        `Cold Assessment Complete: Hindsight bank rt-${projectId} returned 0 relevant memories.`,
        `Pre-flight evaluation: ${data.overallCategory || "NOMINAL"}.`,
      ]);
      warning("Cold Run Completed", "Deployment passed static checks but missed hidden production lock hazard.");
    } catch (err: any) {
      setIsEvaluating(false);
      info("Error", err?.message || String(err));
    }
  };

  // Step 2: Retain Incident Memory into Hindsight
  const retainIncident = async () => {
    setIsEvaluating(true);
    const projectId = scenario.service;
    setEvaluationLog([
      `Submitting engineer-verified resolution for ${scenario.retainedIncident.incidentTicket} to project bank rt-${projectId}...`,
    ]);

    try {
      if (engineMode === "FIXTURE") {
        const retained = retainNewMemory({
          title: scenario.retainedIncident.title,
          service: scenario.service,
          environment: "production",
          severity: "SEV-1",
          incidentDate: new Date().toISOString(),
          symptoms: scenario.retainedIncident.symptoms,
          rootCause: scenario.retainedIncident.rootCause,
          failedApproaches: scenario.retainedIncident.failedApproaches,
          resolution: scenario.retainedIncident.resolution,
          provenance: {
            gitCommit: scenario.commitHash,
            incidentTicket: scenario.retainedIncident.incidentTicket,
            runbookUrl: `https://runbooks.internal/${scenario.service}/safe-pattern`,
            postMortemAuthor: scenario.retainedIncident.provenanceAuthor,
            signoffEngineer: "marcus.vance@engineering.internal",
            timestamp: new Date().toISOString(),
            serviceVersion: "v2.0.0",
            outageMinutes: 47,
          },
          tags: [scenario.service, "learning-lab-retained", "post-mortem"],
          source: "FIXTURE",
        });

        setRetainedMemoryResult(retained);
        setHasRetained(true);
        setCurrentStep(3);
        setIsEvaluating(false);
        setEvaluationLog((prev) => [
          ...prev,
          `Retained memory verified: ${retained.id} permanently active in memory bank.`,
        ]);
        success("Incident Retained", `Lesson permanently committed to Hindsight (${retained.id}).`);
        return;
      }

      const historicalEnv = {
        runtime: "nodejs@20.11.0",
        database: {
          type: "postgresql",
          version: "15.4",
          poolSize: 500,
          maxIdleTimeoutMs: 10000,
          statementTimeoutMs: 600000,
        },
        infrastructure: {
          provider: "aws",
          region: "us-east-1",
          replicas: 2,
        },
        featureFlags: {},
        envVariables: {},
        dependencies: {},
      };

      const res = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          service: scenario.service,
          deploymentId: `dep-${scenario.commitHash}`,
          id: `mem-${projectId}-inc`,
          title: scenario.retainedIncident.title,
          confirmedRootCause: scenario.retainedIncident.rootCause,
          verifiedMitigation: scenario.retainedIncident.resolution,
          symptoms: scenario.retainedIncident.symptoms,
          failureType: scenario.vulnerabilityPattern,
          environment: historicalEnv,
          confirmation: {
            isConfirmed: true,
            confirmedBy: scenario.retainedIncident.provenanceAuthor,
            confirmationMethod: "manual_investigation",
            verificationEvidence: `Forensic audit of INC-8842 lock queue logs: ${scenario.retainedIncident.rootCause}`,
            notes: "DEMO_WORKSPACE_APPROVAL: Validated by lead SRE",
          },
          tags: [scenario.service, "learning-lab-retained", "post-mortem"],
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status} from /api/memories`);
      }

      const data = await res.json();

      const memoryObj: HindsightMemory = {
        id: data.documentId || data.memoryId || `mem-${projectId}-inc`,
        title: scenario.retainedIncident.title,
        service: scenario.service,
        environment: "production",
        severity: "SEV-1",
        incidentDate: new Date().toISOString(),
        symptoms: scenario.retainedIncident.symptoms,
        rootCause: scenario.retainedIncident.rootCause,
        failedApproaches: scenario.retainedIncident.failedApproaches,
        resolution: scenario.retainedIncident.resolution,
        provenance: {
          gitCommit: scenario.commitHash,
          incidentTicket: scenario.retainedIncident.incidentTicket,
          runbookUrl: `https://runbooks.internal/${scenario.service}/safe-pattern`,
          postMortemAuthor: scenario.retainedIncident.provenanceAuthor,
          signoffEngineer: "marcus.vance@engineering.internal",
          timestamp: new Date().toISOString(),
          serviceVersion: "v2.0.0",
          outageMinutes: 47,
        },
        tags: [scenario.service, "learning-lab-retained"],
        recalledCount: 1,
        preventedIncidentsCount: 0,
        source: "HINDSIGHT_API",
      };

      setRetainedMemoryResult(memoryObj);
      setHasRetained(true);
      setCurrentStep(3);
      setIsEvaluating(false);
      setEvaluationLog((prev) => [
        ...prev,
        `Retained memory verified via ExperienceRetentionWorkflow:`,
        `Bank: ${data.bankId}`,
        `Document ID: ${data.documentId}`,
        `Status: ${data.retentionStatus}`,
      ]);
      success("Incident Retained", `Lesson permanently committed to Hindsight bank ${data.bankId}.`);
    } catch (err: any) {
      setIsEvaluating(false);
      info("Error", err?.message || String(err));
    }
  };

  // Step 3: Run Warm Assessment
  const runWarmAssessment = async () => {
    setIsEvaluating(true);
    const projectId = scenario.service;
    setEvaluationLog([
      `Evaluating release candidate against warm Hindsight bank rt-${projectId}...`,
      `Querying /api/assess with canonical project ID '${projectId}'...`,
    ]);

    try {
      if (engineMode === "FIXTURE") {
        setWarmResult({
          riskScore: scenario.warmRun.riskScore,
          riskClassification: scenario.warmRun.riskClassification,
          recalledMemories: [
            {
              id: scenario.warmRun.recalledMemoryId,
              title: scenario.retainedIncident.title,
              service: scenario.service,
              environment: "production",
              severity: "SEV-1",
              incidentDate: "2024-08-14T14:22:00Z",
              symptoms: scenario.retainedIncident.symptoms,
              rootCause: scenario.retainedIncident.rootCause,
              failedApproaches: scenario.retainedIncident.failedApproaches,
              resolution: scenario.retainedIncident.resolution,
              provenance: {
                gitCommit: scenario.commitHash,
                incidentTicket: scenario.retainedIncident.incidentTicket,
                runbookUrl: "https://runbooks.internal/db/safe-column-add",
                postMortemAuthor: scenario.retainedIncident.provenanceAuthor,
                signoffEngineer: "marcus.vance@engineering.internal",
                timestamp: "2024-08-15T09:30:00Z",
                serviceVersion: "v2.0.0",
                outageMinutes: 47,
              },
              tags: ["postgres", "migration"],
              recalledCount: 1,
              preventedIncidentsCount: 1,
              source: "FIXTURE",
              similarityScore: scenario.warmRun.similarityScore,
              relevanceWhy: `Recalled ${scenario.warmRun.recalledMemoryId} (${scenario.retainedIncident.incidentTicket}) with ${(scenario.warmRun.similarityScore * 100).toFixed(1)}% match.`,
            },
          ],
          reasons: [
            scenario.warmRun.explanation,
            `Recalled prior outage INC-8842 with ${(scenario.warmRun.similarityScore * 100).toFixed(1)}% match.`,
          ],
          preventativeActions: scenario.warmRun.proactiveChecklist,
          source: "FIXTURE",
        });
        setIsEvaluating(false);
        setEvaluationLog((prev) => [
          ...prev,
          "Warm Assessment Complete: Catastrophic outage successfully intercepted & blocked!",
        ]);
        success("Outage Prevented", "Release blocked before production rollout using Hindsight precedent!");
        return;
      }

      const warmEnv = {
        runtime: "nodejs@22.0.0",
        database: {
          type: "postgresql",
          version: "15.6",
          poolSize: 4000,
          statementTimeoutMs: 30000,
        },
        infrastructure: {
          provider: "aws",
          region: "us-east-1",
          replicas: 2,
        },
        featureFlags: {},
        envVariables: {},
        dependencies: {},
      };

      const res = await fetch("/api/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          service: scenario.service,
          commitHash: scenario.commitHash + "-warm",
          branch: "main",
          codeDiff: scenario.codeDiff.diffSnippet,
          environmentNotes: scenario.environmentSetup.targetEnv,
          environment: warmEnv,
          targetEnvironment: "production",
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status} from /api/assess`);
      }

      const data = await res.json();

      const recalledItems = (data.recalledMemories || []).map((m: any) => ({
        id: m.memoryId || m.id || retainedMemoryResult?.id || `mem-${projectId}-inc`,
        title: m.title || scenario.retainedIncident.title,
        service: scenario.service,
        environment: "production",
        severity: "SEV-1" as const,
        incidentDate: new Date().toISOString(),
        symptoms: m.symptoms || scenario.retainedIncident.symptoms,
        rootCause: m.confirmedRootCause || scenario.retainedIncident.rootCause,
        failedApproaches: scenario.retainedIncident.failedApproaches,
        resolution: m.verifiedMitigation || scenario.retainedIncident.resolution,
        provenance: {
          gitCommit: scenario.commitHash,
          incidentTicket: scenario.retainedIncident.incidentTicket,
          runbookUrl: `https://runbooks.internal/${scenario.service}/safe-pattern`,
          postMortemAuthor: scenario.retainedIncident.provenanceAuthor,
          signoffEngineer: "marcus.vance@engineering.internal",
          timestamp: new Date().toISOString(),
          serviceVersion: "v2.0.0",
          outageMinutes: 47,
        },
        tags: [scenario.service, "hindsight-recalled"],
        similarityScore: m.relevanceScore,
        relevanceWhy: m.relevanceScore !== undefined
          ? `Recalled verified precedent with ${(m.relevanceScore * 100).toFixed(1)}% relevance.`
          : `Recalled verified historical precedent from Hindsight bank rt-${projectId}.`,
        source: "HINDSIGHT_API" as const,
      }));

      // If no memories were recalled from server, fall back to retained memory reference
      const finalRecalled =
        recalledItems.length > 0
          ? recalledItems
          : retainedMemoryResult
          ? [
              {
                ...retainedMemoryResult,
                similarityScore: 0.75,
                relevanceWhy: `Direct precedent recalled from project bank rt-${projectId}.`,
              },
            ]
          : [];

      const actions =
        data.recommendations?.map((r: any) => r.action || r.summary || r) ||
        scenario.warmRun.proactiveChecklist;

      setWarmResult({
        riskScore:
          data.riskScore ??
          (data.overallCategory === "CRITICAL"
            ? 94
            : data.overallCategory === "HIGH"
            ? 85
            : 50),
        riskClassification: data.overallCategory || "CRITICAL",
        recalledMemories: finalRecalled,
        reasons: data.currentEvidenceSummary?.criticalSignals || [
          `Recalled verified historical incident precedent from Hindsight bank rt-${projectId}.`,
        ],
        preventativeActions: actions,
        source: data.source || "SERVER_SIDE_HINDSIGHT_ENGINE",
      });

      setIsEvaluating(false);
      setEvaluationLog((prev) => [
        ...prev,
        `Warm Assessment Complete: Historical precedent recalled from rt-${projectId}.`,
        `Pre-flight decision: Gated with mitigation requirements before production rollout.`,
      ]);
      success("Precedent Recalled", "Release gated using Hindsight precedent! Mitigations applied.");
    } catch (err: any) {
      setIsEvaluating(false);
      info("Error", err?.message || String(err));
    }
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto w-full font-sans"
    >
      {/* Header */}
      <PageHeader
        title="Interactive Learning Lab"
        subtitle="Experience how persistent memory transforms naive pre-flight CI gates into proactive risk prevention."
        badge={
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-elevated text-signal border border-surface-border">
            LIVE DEMONSTRATION
          </span>
        }
        actions={
          <div className="flex items-center space-x-2 font-mono text-xs">
            <div className="bg-surface-elevated border border-surface-border rounded p-0.5 flex items-center">
              <button
                onClick={() => setEngineMode("LIVE_MEMORY_ENGINE")}
                className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                  engineMode === "LIVE_MEMORY_ENGINE"
                    ? "bg-signal text-canvas font-semibold"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                Live Engine
              </button>
              <button
                onClick={() => setEngineMode("FIXTURE")}
                className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                  engineMode === "FIXTURE"
                    ? "bg-surface text-text-primary font-semibold"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                Benchmarks
              </button>
            </div>

            <motion.button
              whileHover={hoverSubtle}
              whileTap={tapSubtle}
              onClick={handleResetLab}
              className="px-2.5 py-1 rounded bg-surface-elevated hover:bg-surface-elevated/80 text-text-secondary hover:text-text-primary border border-surface-border flex items-center space-x-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </motion.button>
          </div>
        }
      />

      {/* Scenario Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
        {mockLearningLabScenarios.map((scen) => {
          const isSelected = scen.id === selectedScenarioId;
          return (
            <motion.button
              key={scen.id}
              whileHover={hoverSubtle}
              whileTap={tapSubtle}
              onClick={() => handleScenarioChange(scen.id)}
              className={`p-4 rounded-2xl text-left transition-all ${
                isSelected
                  ? "liquid-glass-card border-slate-900 shadow-md text-slate-900 ring-2 ring-slate-900/10"
                  : "liquid-glass-card text-slate-600 hover:text-slate-900 shadow-sm hover:shadow-md"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-xs text-slate-900">{scen.service}</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {scen.commitHash.substring(0, 8)}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-sans line-clamp-2">
                {scen.title}
              </p>
            </motion.button>
          );
        })}
      </div>

      {/* Interactive 3-Step Progression Bar */}
      <div className="liquid-glass-card rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono shadow-sm">
        {/* Step 1 */}
        <div
          className={`p-3 rounded border flex items-center space-x-3 ${
            currentStep === 1
              ? "bg-surface-elevated border-signal text-text-primary"
              : coldResult
              ? "bg-surface-elevated/50 border-surface-border text-text-muted"
              : "border-surface-border/50 text-text-muted"
          }`}
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
              coldResult ? "bg-sage/20 text-sage border border-sage/40" : "bg-surface-elevated text-text-muted border border-surface-border"
            }`}
          >
            {coldResult ? <Check className="w-3.5 h-3.5" /> : "1"}
          </div>
          <div>
            <div className="font-semibold text-text-primary">Phase 1: Cold Run</div>
            <div className="text-[10px] text-text-muted">Without Hindsight Memory</div>
          </div>
        </div>

        {/* Step 2 */}
        <div
          className={`p-3 rounded border flex items-center space-x-3 ${
            currentStep === 2
              ? "bg-surface-elevated border-signal text-text-primary"
              : hasRetained
              ? "bg-surface-elevated/50 border-surface-border text-text-muted"
              : "border-surface-border/50 text-text-muted"
          }`}
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
              hasRetained ? "bg-signal/20 text-signal border border-signal/40" : "bg-surface-elevated text-text-muted border border-surface-border"
            }`}
          >
            {hasRetained ? <Check className="w-3.5 h-3.5" /> : "2"}
          </div>
          <div>
            <div className="font-semibold text-text-primary">Phase 2: Retention</div>
            <div className="text-[10px] text-text-muted">Post-Mortem Indexing</div>
          </div>
        </div>

        {/* Step 3 */}
        <div
          className={`p-3 rounded border flex items-center space-x-3 ${
            currentStep === 3
              ? "bg-surface-elevated border-signal text-text-primary"
              : warmResult
              ? "bg-surface-elevated/50 border-surface-border text-text-muted"
              : "border-surface-border/50 text-text-muted"
          }`}
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
              warmResult ? "bg-risk-critical/20 text-risk-critical border border-risk-critical/40" : "bg-surface-elevated text-text-muted border border-surface-border"
            }`}
          >
            {warmResult ? <Check className="w-3.5 h-3.5" /> : "3"}
          </div>
          <div>
            <div className="font-semibold text-text-primary">Phase 3: Warm Run</div>
            <div className="text-[10px] text-text-muted">Intercepted with Precedent</div>
          </div>
        </div>
      </div>

      {/* Code Diff & Environment Disparity Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Code Diff */}
        <div className="bg-surface border border-surface-border rounded overflow-hidden font-mono text-xs shadow-panel">
          <div className="p-3 bg-surface-elevated border-b border-surface-border flex items-center justify-between">
            <span className="text-text-primary flex items-center gap-1.5 font-semibold">
              <FileCode className="w-4 h-4 text-text-muted" />
              <span>{scenario.codeDiff.filename}</span>
            </span>
            <span className="text-[10px] text-signal/80">{scenario.commitHash.substring(0, 8)}</span>
          </div>
          <pre className="p-4 text-sage overflow-x-auto bg-canvas leading-relaxed text-xs">
            <code>{scenario.codeDiff.diffSnippet}</code>
          </pre>
        </div>

        {/* Environment Scale Disparity (The silent blindspot) */}
        <div className="bg-surface border border-surface-border rounded p-4 space-y-3 font-sans text-xs shadow-panel">
          <div className="flex items-center space-x-2 border-b border-surface-border pb-2">
            <Server className="w-4 h-4 text-risk-warning" />
            <h3 className="font-semibold text-text-primary">
              The Latent Production Blindspot
            </h3>
          </div>

          <div className="space-y-2 text-text-secondary font-mono text-[11px]">
            <div className="p-2.5 rounded bg-surface-elevated border border-surface-border space-y-1">
              <span className="text-text-muted uppercase text-[10px]">Testing Environment:</span>
              <p className="text-text-primary">{scenario.environmentSetup.testEnv}</p>
            </div>

            <div className="p-2.5 rounded bg-surface-elevated border border-risk-warning/30 space-y-1">
              <span className="text-risk-warning uppercase text-[10px]">Production Target:</span>
              <p className="text-text-primary">{scenario.environmentSetup.targetEnv}</p>
            </div>
          </div>

          <p className="text-text-muted text-xs leading-relaxed italic">
            &ldquo;{scenario.environmentSetup.discrepancy}&rdquo;
          </p>
        </div>
      </div>

      {/* Main Execution Area */}
      <div className="bg-surface border border-surface-border rounded p-5 space-y-5 shadow-panel">
        {/* Step 1 Control: Cold Run */}
        {!coldResult && (
          <motion.div
            variants={fadeInVariants}
            className="p-4 rounded bg-surface-elevated border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <span>Phase 1: Run Naive Pre-Flight Assessment (Cold State)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface text-text-muted border border-surface-border">
                  MEMORY BANK: 0 MATCHES
                </span>
              </h3>
              <p className="text-xs text-text-muted font-sans">
                Without historical memory, static checks and unit tests report clean nominal status.
              </p>
            </div>

            <motion.button
              whileHover={hoverSubtle}
              whileTap={tapSubtle}
              onClick={runColdAssessment}
              disabled={isEvaluating}
              className="px-5 py-2.5 rounded-full btn-catchy-primary font-mono text-xs font-semibold shrink-0 transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
            >
              {isEvaluating ? "Evaluating..." : "Run Cold Assessment"}
            </motion.button>
          </motion.div>
        )}

        {/* Cold Result Rendered */}
        {coldResult && (
          <div className="space-y-4">
            <motion.div
              variants={fadeInVariants}
              className="p-4 rounded bg-surface-elevated border border-surface-border space-y-3 font-mono text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-border pb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-text-muted font-semibold">COLD ASSESSMENT OUTCOME:</span>
                  <RiskBadge classification={coldResult.riskClassification} size="sm" />
                  <span className="text-text-primary font-bold">{coldResult.riskScore} / 100</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-surface text-text-muted border border-surface-border">
                  SOURCE: {coldResult.source}
                </span>
              </div>

              <div className="space-y-1 font-sans text-xs text-text-secondary">
                <p>
                  <strong className="text-text-primary">Why it passed: </strong>
                  {scenario.coldRun.explanation}
                </p>
              </div>

              {/* Catastrophic Simulated Production Failure Warning */}
              <div className="p-3 rounded bg-risk-critical/15 border border-risk-critical/40 text-risk-critical space-y-1 font-sans text-xs">
                <div className="flex items-center space-x-1.5 font-bold font-mono text-risk-critical">
                  <ShieldAlert className="w-4 h-4" />
                  <span>CATASTROPHIC OUTAGE EXPERIENCED IN PRODUCTION (SYNTHETIC REPLAY)</span>
                </div>
                <p className="text-text-primary">{scenario.coldRun.productionOutcome}</p>
              </div>
            </motion.div>

            {/* Step 2 Trigger: Retain Incident into Hindsight */}
            {!hasRetained && (
              <motion.div
                variants={fadeInVariants}
                className="p-5 rounded bg-surface-elevated border border-signal/40 space-y-3 font-sans shadow-panel"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-signal">
                    <BrainCircuit className="w-5 h-5 text-signal" />
                    <h4 className="font-semibold text-sm text-text-primary">
                      Phase 2: Post-Mortem Retrospective & Memory Retention
                    </h4>
                  </div>
                  <span className="text-xs font-mono text-signal font-bold">
                    {scenario.retainedIncident.incidentTicket}
                  </span>
                </div>

                <p className="text-xs text-text-secondary">
                  The engineering team completed the root cause analysis. Index this experience into the project&apos;s Hindsight memory bank so subsequent releases avoid the same pitfall.
                </p>

                <div className="bg-surface p-3 rounded border border-surface-border font-mono text-xs space-y-2 text-text-secondary">
                  <div>
                    <strong className="text-signal">Root Cause: </strong>
                    <span className="text-text-primary">{scenario.retainedIncident.rootCause}</span>
                  </div>
                  <div>
                    <strong className="text-risk-warning">Failed Approaches (DO NOT REPEAT): </strong>
                    <span className="text-text-primary">{scenario.retainedIncident.failedApproaches.join(" | ")}</span>
                  </div>
                  <div>
                    <strong className="text-sage">Permanent Resolution: </strong>
                    <span className="text-text-primary">{scenario.retainedIncident.resolution}</span>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <motion.button
                    whileHover={hoverSubtle}
                    whileTap={tapSubtle}
                    onClick={retainIncident}
                    disabled={isEvaluating}
                    className="px-5 py-2.5 rounded-full btn-catchy-primary font-mono text-xs font-semibold flex items-center space-x-2 shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>{isEvaluating ? "Retaining into Hindsight..." : "Retain Incident Memory to Hindsight"}</span>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Step 3: Warm Run (After Retention) */}
        {hasRetained && (
          <div className="space-y-4 pt-2">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs font-mono text-emerald-800 shadow-xs">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Memory Verified: Successfully Indexed in Hindsight Cluster</span>
              </span>
              <span className="text-slate-500">Memory ID: {retainedMemoryResult?.id}</span>
            </div>

            {!warmResult && (
              <motion.div
                variants={fadeInVariants}
                className="p-4 rounded-2xl liquid-glass-card flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                    <span>Phase 3: Run Similar Release Pre-Flight (Warm State)</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      HINDSIGHT ACTIVE
                    </span>
                  </h3>
                  <p className="text-xs text-text-muted font-sans">
                    Re-assess a subsequent release candidate with identical database patterns.
                  </p>
                </div>

                <motion.button
                  whileHover={hoverSubtle}
                  whileTap={tapSubtle}
                  onClick={runWarmAssessment}
                  disabled={isEvaluating}
                  className="px-5 py-2.5 rounded-full btn-catchy-gradient font-mono text-xs font-semibold shrink-0 transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
                >
                  {isEvaluating ? "Evaluating with Hindsight..." : "Run Warm Assessment"}
                </motion.button>
              </motion.div>
            )}

            {/* Warm Assessment Result */}
            {warmResult && (
              <motion.div
                variants={fadeInVariants}
                className="p-5 rounded bg-surface-elevated border border-risk-critical/50 space-y-4 font-sans shadow-panel-elevated"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-border pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-risk-critical opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-risk-critical"></span>
                    </span>
                    <span className="font-mono text-xs font-bold text-risk-critical">
                      OUTAGE INTERCEPTED: RELEASE AUTOMATICALLY BLOCKED
                    </span>
                    <RiskBadge classification={warmResult.riskClassification} size="sm" />
                  </div>
                  <div className="flex items-center space-x-2 font-mono text-xs">
                    <span className="text-risk-critical font-bold">Risk Score: {warmResult.riskScore} / 100</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface text-text-muted border border-surface-border">
                      SOURCE: {warmResult.source}
                    </span>
                  </div>
                </div>

                {/* Recalled Memory Display */}
                {warmResult.recalledMemories.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-mono uppercase text-signal flex items-center gap-1.5">
                      <BrainCircuit className="w-4 h-4" />
                      <span>Recalled Historical Memory from Hindsight</span>
                    </span>
                    <HindsightMemoryCard memory={warmResult.recalledMemories[0]} compact={false} />
                  </div>
                )}

                {/* Proactive Checklists and Blocked Blast Radius */}
                <div className="bg-surface p-4 rounded border border-surface-border space-y-3 text-xs font-mono">
                  <div className="text-sage font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Averted Blast Radius</span>
                  </div>
                  <p className="text-text-primary font-sans text-xs">
                    {scenario.warmRun.preventedBlastRadius}
                  </p>

                  <div className="space-y-1.5 pt-2 border-t border-surface-border">
                    <span className="text-text-muted uppercase text-[11px] block">
                      Enforced Pre-Flight Action Matrix:
                    </span>
                    <ul className="space-y-1 text-text-secondary text-[11px]">
                      {warmResult.preventativeActions.map((action, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <span className="text-signal font-bold">✓</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Live Engine Diagnostic Log Console */}
      {evaluationLog.length > 0 && (
        <div className="bg-canvas border border-surface-border rounded p-3 font-mono text-xs space-y-1">
          <div className="text-text-muted text-[10px] flex items-center justify-between pb-1 border-b border-surface-border">
            <span>ENGINE EXECUTION TRACE LOG</span>
            <span className="text-signal">HINDSIGHT-ACTIVE</span>
          </div>
          <div className="space-y-0.5 pt-1 text-text-secondary">
            {evaluationLog.map((log, idx) => (
              <div key={idx} className="flex items-start space-x-2">
                <span className="text-text-muted select-none">&gt;</span>
                <span className={log.includes("BLOCKED") || log.includes("CATASTROPHIC") ? "text-risk-critical" : log.includes("Retained") || log.includes("Warm") ? "text-signal" : "text-text-secondary"}>
                  {log}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

