"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  BrainCircuit,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  FileCode,
  Server,
  Zap,
  Check,
  TrendingDown,
  Layers,
  ChevronRight,
  Lock,
} from "lucide-react";
import { mockLearningLabScenarios } from "@/data/mockData";
import { LearningLabScenario, HindsightMemory } from "@/types";
import {
  evaluateReleaseRisk,
  getActiveMemories,
  retainNewMemory,
  resetMemoriesToDefault,
  EngineAssessmentResult,
} from "@/lib/memoryEngine";
import { RiskBadge, StatusBadge } from "@/components/ui/StatusBadge";
import { HindsightMemoryCard } from "@/components/ui/HindsightMemoryCard";

export default function LearningLabPage() {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("scenario-postgres-lock");
  const [engineMode, setEngineMode] = useState<"LIVE_MEMORY_ENGINE" | "FIXTURE">("LIVE_MEMORY_ENGINE");

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

  const handleResetLab = () => {
    resetMemoriesToDefault();
    setCurrentStep(1);
    setHasRetained(false);
    setRetainedMemoryResult(null);
    setColdResult(null);
    setWarmResult(null);
    setEvaluationLog(["Memory bank purged. Baseline tabula rasa restored."]);
  };

  // Step 1: Run Cold Assessment
  const runColdAssessment = () => {
    setIsEvaluating(true);
    setEvaluationLog([
      "Initializing Pre-flight CI Gate Scanner...",
      "Analyzing AST of SQL migration...",
      "Validating schema syntax against PostgreSQL 15 grammar: VALID",
      "Querying Hindsight Memory Engine for semantic matches...",
      "Index match count: 0 (No prior memory found)",
      "Falling back to basic static heuristic classifier...",
    ]);

    setTimeout(() => {
      if (engineMode === "LIVE_MEMORY_ENGINE") {
        // Run live memory engine without the retained scenario incident
        const result = evaluateReleaseRisk(
          scenario.codeDiff.diffSnippet,
          scenario.service,
          scenario.environmentSetup.testEnv,
          [] // Empty memory bank simulates cold state!
        );
        setColdResult(result);
      } else {
        // Fixture benchmark mode
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
      }

      setIsEvaluating(false);
      setEvaluationLog((prev) => [
        ...prev,
        "Cold Assessment Complete: Blindspot detected! Risk marked NOMINAL due to lack of historical memory.",
      ]);
    }, 600);
  };

  // Step 2: Retain Incident Memory into Hindsight
  const retainIncident = () => {
    setIsEvaluating(true);
    setEvaluationLog([
      `Formulating retrospective memory from ${scenario.retainedIncident.incidentTicket}...`,
      `Tokenizing symptoms (${scenario.retainedIncident.symptoms.length} items)...`,
      `Indexing root cause: "${scenario.retainedIncident.rootCause}"...`,
      `Recording failed approaches to blacklist: ${scenario.retainedIncident.failedApproaches.join(" | ")}...`,
      "Committing embedding vector to Hindsight persistent cluster...",
    ]);

    setTimeout(() => {
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
        source: engineMode === "LIVE_MEMORY_ENGINE" ? "LOCAL_ENGINE" : "FIXTURE",
      });

      setRetainedMemoryResult(retained);
      setHasRetained(true);
      setCurrentStep(3);
      setIsEvaluating(false);
      setEvaluationLog((prev) => [
        ...prev,
        `Retained memory verified: ${retained.id} permanently active in memory bank.`,
      ]);
    }, 700);
  };

  // Step 3: Run Warm Assessment
  const runWarmAssessment = () => {
    setIsEvaluating(true);
    setEvaluationLog([
      "Evaluating subsequent release candidate with identical architectural footprint...",
      "Executing AST semantic similarity comparison...",
      "Querying Hindsight Memory Bank...",
      `Matched memory candidate: ${retainedMemoryResult?.id || "MEM-RETAINED"}!`,
      "Synthesizing proactive verification gate and failed-approach blockers...",
    ]);

    setTimeout(() => {
      if (engineMode === "LIVE_MEMORY_ENGINE" && retainedMemoryResult) {
        const result = evaluateReleaseRisk(
          scenario.codeDiff.diffSnippet,
          scenario.service,
          `${scenario.environmentSetup.testEnv} ${scenario.environmentSetup.targetEnv}`,
          [retainedMemoryResult]
        );
        setWarmResult(result);
      } else {
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
              relevanceWhy: `Recalled ${scenario.warmRun.recalledMemoryId} (${scenario.retainedIncident.incidentTicket}) with ${(scenario.warmRun.similarityScore * 100).toFixed(1)}% similarity.`,
            },
          ],
          reasons: [
            scenario.warmRun.explanation,
            `Recalled prior outage INC-8842 with ${(scenario.warmRun.similarityScore * 100).toFixed(1)}% match.`,
          ],
          preventativeActions: scenario.warmRun.proactiveChecklist,
          source: "FIXTURE",
        });
      }

      setIsEvaluating(false);
      setEvaluationLog((prev) => [
        ...prev,
        "Warm Assessment Complete: Catastrophic outage successfully intercepted & blocked!",
      ]);
    }, 700);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto w-full font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-surface-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
            <span>Hindsight Learning Laboratory</span>
            <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800">
              BEFORE & AFTER DEMONSTRATION
            </span>
          </h1>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">
            Demonstrating how AI agents transition from naive static blindspots to proactive memory-driven protection
          </p>
        </div>

        {/* Engine Mode Toggle & Reset */}
        <div className="flex items-center space-x-2 font-mono text-xs">
          <div className="bg-surface-subtle border border-surface-border rounded p-0.5 flex items-center">
            <button
              onClick={() => setEngineMode("LIVE_MEMORY_ENGINE")}
              className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                engineMode === "LIVE_MEMORY_ENGINE"
                  ? "bg-purple-900/70 text-purple-200 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Live Semantic Engine
            </button>
            <button
              onClick={() => setEngineMode("FIXTURE")}
              className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                engineMode === "FIXTURE"
                  ? "bg-zinc-800 text-zinc-200 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Benchmark Fixtures
            </button>
          </div>

          <button
            onClick={handleResetLab}
            className="px-2.5 py-1 rounded bg-surface-subtle hover:bg-surface-border text-zinc-400 hover:text-zinc-200 border border-surface-border flex items-center space-x-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Lab</span>
          </button>
        </div>
      </div>

      {/* Scenario Selection Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
        {mockLearningLabScenarios.map((scen) => {
          const isSelected = scen.id === selectedScenarioId;
          return (
            <button
              key={scen.id}
              onClick={() => handleScenarioChange(scen.id)}
              className={`p-3 rounded-lg border text-left transition-all ${
                isSelected
                  ? "bg-surface-muted border-brand-hindsight shadow-glow-hindsight text-white"
                  : "bg-surface border-surface-border text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-xs text-zinc-200">{scen.service}</span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {scen.commitHash}
                </span>
              </div>
              <p className="text-[11px] text-zinc-300 font-sans line-clamp-2">
                {scen.title}
              </p>
            </button>
          );
        })}
      </div>

      {/* Interactive 3-Step Progression Bar */}
      <div className="bg-surface border border-surface-border rounded-lg p-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
        {/* Step 1 */}
        <div
          className={`p-3 rounded border flex items-center space-x-3 ${
            currentStep === 1
              ? "bg-surface-subtle border-brand-hindsight text-white"
              : coldResult
              ? "bg-surface-subtle/50 border-surface-border text-zinc-400"
              : "border-surface-border/50 text-zinc-500"
          }`}
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
              coldResult ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-zinc-800 text-zinc-300"
            }`}
          >
            {coldResult ? <Check className="w-3.5 h-3.5" /> : "1"}
          </div>
          <div>
            <div className="font-semibold text-zinc-200">State 1: Cold Run</div>
            <div className="text-[10px] text-zinc-500">Without Hindsight Memory</div>
          </div>
        </div>

        {/* Step 2 */}
        <div
          className={`p-3 rounded border flex items-center space-x-3 ${
            currentStep === 2
              ? "bg-surface-subtle border-brand-hindsight text-white"
              : hasRetained
              ? "bg-surface-subtle/50 border-surface-border text-zinc-400"
              : "border-surface-border/50 text-zinc-500"
          }`}
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
              hasRetained ? "bg-purple-950 text-purple-300 border border-purple-800" : "bg-zinc-800 text-zinc-300"
            }`}
          >
            {hasRetained ? <Check className="w-3.5 h-3.5" /> : "2"}
          </div>
          <div>
            <div className="font-semibold text-zinc-200">State 2: Incident Retention</div>
            <div className="text-[10px] text-zinc-500">Post-Mortem Indexing</div>
          </div>
        </div>

        {/* Step 3 */}
        <div
          className={`p-3 rounded border flex items-center space-x-3 ${
            currentStep === 3
              ? "bg-surface-subtle border-brand-hindsight text-white"
              : warmResult
              ? "bg-surface-subtle/50 border-surface-border text-zinc-400"
              : "border-surface-border/50 text-zinc-500"
          }`}
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
              warmResult ? "bg-red-950 text-red-400 border border-red-800" : "bg-zinc-800 text-zinc-300"
            }`}
          >
            {warmResult ? <Check className="w-3.5 h-3.5" /> : "3"}
          </div>
          <div>
            <div className="font-semibold text-zinc-200">State 3: Warm Run</div>
            <div className="text-[10px] text-zinc-500">Recalled Incident & Intercepted</div>
          </div>
        </div>
      </div>

      {/* Code Diff & Environment Disparity Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Code Diff */}
        <div className="bg-surface border border-surface-border rounded-lg overflow-hidden font-mono text-xs">
          <div className="p-3 bg-surface-subtle border-b border-surface-border flex items-center justify-between">
            <span className="text-zinc-300 flex items-center gap-1.5 font-semibold">
              <FileCode className="w-4 h-4 text-zinc-400" />
              <span>{scenario.codeDiff.filename}</span>
            </span>
            <span className="text-[10px] text-zinc-500">{scenario.commitHash}</span>
          </div>
          <pre className="p-4 text-emerald-400 overflow-x-auto bg-[#07080b] leading-relaxed">
            <code>{scenario.codeDiff.diffSnippet}</code>
          </pre>
        </div>

        {/* Environment Scale Disparity (The silent blindspot) */}
        <div className="bg-surface border border-surface-border rounded-lg p-4 space-y-3 font-sans text-xs">
          <div className="flex items-center space-x-2 border-b border-surface-border pb-2">
            <Server className="w-4 h-4 text-amber-400" />
            <h3 className="font-semibold text-zinc-100">
              The Latent Production Blindspot
            </h3>
          </div>

          <div className="space-y-2 text-zinc-300 font-mono text-[11px]">
            <div className="p-2.5 rounded bg-surface-subtle border border-surface-border space-y-1">
              <span className="text-zinc-500 uppercase text-[10px]">Testing Environment:</span>
              <p className="text-zinc-200">{scenario.environmentSetup.testEnv}</p>
            </div>

            <div className="p-2.5 rounded bg-surface-subtle border border-amber-900/50 space-y-1">
              <span className="text-amber-400 uppercase text-[10px]">Production Target:</span>
              <p className="text-zinc-200">{scenario.environmentSetup.targetEnv}</p>
            </div>
          </div>

          <p className="text-zinc-400 text-xs leading-relaxed italic">
            &ldquo;{scenario.environmentSetup.discrepancy}&rdquo;
          </p>
        </div>
      </div>

      {/* Main Execution Area */}
      <div className="bg-surface border border-surface-border rounded-lg p-5 space-y-5">
        {/* Step 1 Control: Cold Run */}
        {!coldResult && (
          <div className="p-4 rounded-lg bg-surface-subtle border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <span>Phase 1: Run Naive Pre-Flight Assessment (Cold State)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                  MEMORY BANK: 0 MATCHES
                </span>
              </h3>
              <p className="text-xs text-zinc-400 font-sans">
                Notice that without Hindsight memory, standard linters and tests report all green.
              </p>
            </div>

            <button
              onClick={runColdAssessment}
              disabled={isEvaluating}
              className="px-4 py-2 rounded bg-zinc-200 hover:bg-white text-zinc-950 font-mono text-xs font-semibold shrink-0 transition-colors"
            >
              {isEvaluating ? "Evaluating..." : "Run Cold Assessment"}
            </button>
          </div>
        )}

        {/* Cold Result Rendered */}
        {coldResult && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-surface-subtle border border-surface-border space-y-3 font-mono text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-border pb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-zinc-400 font-semibold">COLD ASSESSMENT OUTCOME:</span>
                  <RiskBadge classification={coldResult.riskClassification} size="sm" />
                  <span className="text-zinc-300 font-bold">{coldResult.riskScore} / 100</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                  SOURCE: {coldResult.source}
                </span>
              </div>

              <div className="space-y-1 font-sans text-xs text-zinc-300">
                <p>
                  <strong>Why it passed: </strong>
                  {scenario.coldRun.explanation}
                </p>
              </div>

              {/* Catastrophic Simulated Production Failure Warning */}
              <div className="p-3 rounded bg-red-950/40 border border-red-800 text-red-300 space-y-1 font-sans text-xs">
                <div className="flex items-center space-x-1.5 font-bold font-mono text-red-400">
                  <ShieldAlert className="w-4 h-4" />
                  <span>CATASTROPHIC OUTAGE EXPERIENCED IN PRODUCTION</span>
                </div>
                <p>{scenario.coldRun.productionOutcome}</p>
              </div>
            </div>

            {/* Step 2 Trigger: Retain Incident into Hindsight */}
            {!hasRetained && (
              <div className="p-5 rounded-lg bg-purple-950/20 border border-purple-800/60 space-y-3 font-sans">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-purple-300">
                    <BrainCircuit className="w-5 h-5 text-purple-400" />
                    <h4 className="font-semibold text-sm">
                      Phase 2: Post-Mortem Retrospective & Memory Retention
                    </h4>
                  </div>
                  <span className="text-xs font-mono text-purple-400 font-bold">
                    {scenario.retainedIncident.incidentTicket}
                  </span>
                </div>

                <p className="text-xs text-zinc-300">
                  Engineers completed the SEV-1 post-mortem. Now retain this hard-learned lesson into the Hindsight Memory Engine so no future engineer repeats it.
                </p>

                <div className="bg-surface/80 p-3 rounded border border-surface-border font-mono text-xs space-y-2 text-zinc-300">
                  <div>
                    <strong className="text-purple-400">Root Cause: </strong>
                    <span>{scenario.retainedIncident.rootCause}</span>
                  </div>
                  <div>
                    <strong className="text-amber-400">Failed Approaches (DO NOT REPEAT): </strong>
                    <span>{scenario.retainedIncident.failedApproaches.join(" | ")}</span>
                  </div>
                  <div>
                    <strong className="text-emerald-400">Permanent Resolution: </strong>
                    <span>{scenario.retainedIncident.resolution}</span>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={retainIncident}
                    disabled={isEvaluating}
                    className="px-4 py-2 rounded bg-brand-hindsight hover:bg-brand-hindsight-dark text-white font-mono text-xs font-semibold flex items-center space-x-1.5 shadow-glow-hindsight transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isEvaluating ? "Retaining into Hindsight..." : "Retain Incident Memory to Hindsight"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Warm Run (After Retention) */}
        {hasRetained && (
          <div className="space-y-4 pt-2">
            <div className="p-3 bg-emerald-950/30 border border-emerald-800/50 rounded flex items-center justify-between text-xs font-mono text-emerald-400">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Memory Verified: Successfully Indexed in Hindsight Cluster</span>
              </span>
              <span className="text-zinc-400">Memory ID: {retainedMemoryResult?.id}</span>
            </div>

            {!warmResult && (
              <div className="p-4 rounded-lg bg-surface-subtle border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                    <span>Phase 3: Run Similar Release Pre-Flight (Post-Learning)</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                      HINDSIGHT ACTIVE
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400 font-sans">
                    Now re-assess with the newly learned Hindsight memory bank in place.
                  </p>
                </div>

                <button
                  onClick={runWarmAssessment}
                  disabled={isEvaluating}
                  className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-semibold shrink-0 transition-colors shadow-glow-hindsight"
                >
                  {isEvaluating ? "Evaluating with Hindsight..." : "Run Warm Assessment"}
                </button>
              </div>
            )}

            {/* Warm Assessment Result */}
            {warmResult && (
              <div className="p-5 rounded-lg bg-red-950/20 border border-red-800/80 space-y-4 font-sans shadow-technical-md">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-red-800/40 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                    <span className="font-mono text-xs font-bold text-red-400">
                      OUTAGE INTERCEPTED: RELEASE AUTOMATICALLY BLOCKED
                    </span>
                    <RiskBadge classification={warmResult.riskClassification} size="sm" />
                  </div>
                  <div className="flex items-center space-x-2 font-mono text-xs">
                    <span className="text-red-400 font-bold">Risk Score: {warmResult.riskScore} / 100</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                      SOURCE: {warmResult.source}
                    </span>
                  </div>
                </div>

                {/* Recalled Memory Display */}
                {warmResult.recalledMemories.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-mono uppercase text-purple-400 flex items-center gap-1.5">
                      <BrainCircuit className="w-4 h-4" />
                      <span>Recalled Historical Memory from Hindsight</span>
                    </span>
                    <HindsightMemoryCard memory={warmResult.recalledMemories[0]} compact={false} />
                  </div>
                )}

                {/* Proactive Checklists and Blocked Blast Radius */}
                <div className="bg-surface/80 p-4 rounded border border-surface-border space-y-3 text-xs font-mono">
                  <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Averted Blast Radius</span>
                  </div>
                  <p className="text-zinc-300 font-sans text-xs">
                    {scenario.warmRun.preventedBlastRadius}
                  </p>

                  <div className="space-y-1.5 pt-2 border-t border-surface-border">
                    <span className="text-zinc-400 uppercase text-[11px] block">
                      Enforced Pre-Flight Action Matrix:
                    </span>
                    <ul className="space-y-1 text-zinc-300 text-[11px]">
                      {warmResult.preventativeActions.map((action, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <span className="text-purple-400 font-bold">✓</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Live Engine Diagnostic Log Console */}
      {evaluationLog.length > 0 && (
        <div className="bg-[#050608] border border-surface-border rounded-lg p-3 font-mono text-xs space-y-1">
          <div className="text-zinc-500 text-[10px] flex items-center justify-between pb-1 border-b border-zinc-900">
            <span>ENGINE EXECUTION TRACE LOG</span>
            <span>HINDSIGHT V2.4-ACTIVE</span>
          </div>
          <div className="space-y-0.5 pt-1 text-zinc-400">
            {evaluationLog.map((log, idx) => (
              <div key={idx} className="flex items-start space-x-2">
                <span className="text-zinc-600 select-none">&gt;</span>
                <span className={log.includes("BLOCKED") || log.includes("CATASTROPHIC") ? "text-red-400" : log.includes("Retained") || log.includes("Warm") ? "text-purple-300" : "text-zinc-400"}>
                  {log}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
