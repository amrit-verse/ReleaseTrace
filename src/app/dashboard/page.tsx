"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ShieldAlert,
  GitCommit,
  BrainCircuit,
  TrendingDown,
  ArrowRight,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Zap,
  Workflow,
  BookOpen,
  GraduationCap,
  CheckCircle2,
} from "lucide-react";
import { mockDeployments, mockRecurringFailureCategories } from "@/data/mockData";
import { RiskBadge, StatusBadge } from "@/components/ui/StatusBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { PlainEnglishCallout } from "@/components/ui/PlainEnglishCallout";
import { FirstTimeDeployerGuide } from "@/components/ui/FirstTimeDeployerGuide";
import { useDevOpsGuide } from "@/context/DevOpsGuideContext";
import {
  fadeInVariants,
  staggerContainer,
  hoverSubtle,
  tapSubtle,
} from "@/lib/motion";

export default function DashboardPage() {
  const [filterEnvironment, setFilterEnvironment] = useState<string>("ALL");
  const { setIsFlowModalOpen, setIsSimulatorModalOpen, setIsGlossaryModalOpen } = useDevOpsGuide();

  // Live stats state with fallback defaults matching reference UI
  const [liveStats, setLiveStats] = useState<{
    totalDeployments: number;
    activeAssessments: number;
    criticalBlockedCount: number;
    verifiedPrecedentsCount: number;
    deterministicRuleCount: number;
    bankId: string;
    isMock: boolean;
    latestDeployments: any[];
  }>({
    totalDeployments: 26,
    activeAssessments: mockDeployments.length,
    criticalBlockedCount: 0,
    verifiedPrecedentsCount: 0,
    deterministicRuleCount: 8,
    bankId: "rt-proj_releasetrace_core",
    isMock: false,
    latestDeployments: [],
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/dashboard/stats?projectId=proj_releasetrace_core");
        if (res.ok) {
          const data = await res.json();
          setLiveStats((prev) => ({
            ...prev,
            totalDeployments: data.totalDeployments > 0 ? data.totalDeployments : prev.totalDeployments,
            activeAssessments: data.activeAssessments > 0 ? data.activeAssessments : prev.activeAssessments,
            criticalBlockedCount: data.criticalBlockedCount ?? prev.criticalBlockedCount,
            verifiedPrecedentsCount: data.memoryDocumentCount ?? data.verifiedPrecedentsCount ?? prev.verifiedPrecedentsCount,
            deterministicRuleCount: data.deterministicRuleCount || 8,
            bankId: data.bankId || prev.bankId,
            isMock: Boolean(data.isMock),
            latestDeployments: Array.isArray(data.latestDeployments) ? data.latestDeployments : [],
          }));
        }
      } catch {
        // Keep resilient defaults
      }
    }
    void fetchStats();
  }, []);

  const totalMonitoredDeployments = liveStats.totalDeployments;
  const criticalBlockedCount = liveStats.criticalBlockedCount;
  const verifiedPrecedentsCount = liveStats.verifiedPrecedentsCount;
  const deterministicRuleCount = liveStats.deterministicRuleCount;

  const filteredDeployments =
    filterEnvironment === "ALL"
      ? mockDeployments
      : mockDeployments.filter((d) => d.environment.toLowerCase() === filterEnvironment.toLowerCase());

  const latestAssessment = mockDeployments[0]; // dep-prod-9402

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto w-full"
    >
      {/* Page Title & System Status Banner */}
      <PageHeader
        title="Release Operations Overview"
        subtitle="Deterministic pre-flight risk classification, Prisma migration analysis, and Hindsight incident recall."
        badge={
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-elevated text-signal border border-surface-border">
            ENGINE ACTIVE
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSimulatorModalOpen(true)}
              className="px-3 py-1.5 rounded bg-signal/15 hover:bg-signal/25 text-signal border border-signal/40 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors shadow-panel"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Test Sandbox</span>
            </button>
            <Link href="/learning-lab">
              <motion.div
                whileHover={hoverSubtle}
                whileTap={tapSubtle}
                className="px-3 py-1.5 rounded bg-surface-elevated hover:bg-surface-elevated/80 text-text-primary border border-surface-border text-xs font-mono font-medium flex items-center gap-1.5 transition-colors shadow-panel"
              >
                <Sparkles className="w-3.5 h-3.5 text-signal" />
                <span>Learning Lab</span>
              </motion.div>
            </Link>
          </div>
        }
      />

      {/* Beginner-Friendly "In Plain English" Explanatory Callout */}
      <PlainEnglishCallout
        title="What is ReleaseTrace and why does it exist?"
        analogy="Think of ReleaseTrace like an automated airport flight safety checker for your code before it deploys to live users. Instead of hoping a database change doesn't crash your servers at 3 AM, ReleaseTrace inspects past incidents and database locks in seconds."
        explanation="Every time a pull request is created or code is pushed, ReleaseTrace extracts Git diffs, inspects Prisma schema migrations for exclusive table locks, compares staging vs production configuration, and queries Vectorize Hindsight memory to see if this pattern has ever crashed production before."
        whyItMatters="Catching a database deadlock or connection pool starvation in CI costs $0. Fixing it after production goes down costs hours of downtime, customer loss, and emergency stress."
        keyTerms={["Pre-Flight CI Gate", "Prisma Migration & Schema Lock", "Connection Pool Saturation", "Hindsight Memory Bank"]}
        suggestedAction={{
          label: "Test a simulated release",
          onClick: () => setIsSimulatorModalOpen(true),
        }}
      />

      {/* First-Time Deployer Assistant & Project Optimizer */}
      <FirstTimeDeployerGuide />

      {/* Primary Operational Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
        {/* Metric 1: Monitored Deployments */}
        <motion.div
          variants={fadeInVariants}
          className="bg-surface border border-surface-border rounded p-3.5 space-y-1 shadow-panel"
        >
          <div className="flex items-center justify-between text-text-muted text-[11px]">
            <span>ACTIVE RUNS</span>
            <GitCommit className="w-3.5 h-3.5 text-text-secondary" />
          </div>
          <div className="text-2xl font-bold text-text-primary">{totalMonitoredDeployments}</div>
          <div className="text-[10px] text-text-secondary flex items-center gap-1">
            <span className="text-signal font-semibold">Vercel &amp; Neon</span>
            <span>targets correlated</span>
          </div>
        </motion.div>

        {/* Metric 2: Interceptions / Blocked */}
        <motion.div
          variants={fadeInVariants}
          className="bg-surface border border-surface-border rounded p-3.5 space-y-1 shadow-panel"
        >
          <div className="flex items-center justify-between text-text-muted text-[11px]">
            <span>INTERCEPTIONS</span>
            <ShieldAlert className="w-3.5 h-3.5 text-risk-critical" />
          </div>
          <div className="text-2xl font-bold text-risk-critical">{criticalBlockedCount}</div>
          <div className="text-[10px] text-text-secondary flex items-center gap-1">
            <span className="text-risk-critical font-semibold">Critical Intercept</span>
            <span>• Pre-flight CI Gate</span>
          </div>
        </motion.div>

        {/* Metric 3: Verified Precedents Recalled */}
        <motion.div
          variants={fadeInVariants}
          className="bg-surface border border-surface-border rounded p-3.5 space-y-1 shadow-panel"
        >
          <div className="flex items-center justify-between text-text-muted text-[11px]">
            <span>RETAINED MEMORIES</span>
            <BrainCircuit className="w-3.5 h-3.5 text-signal" />
          </div>
          <div className="text-2xl font-bold text-signal">{verifiedPrecedentsCount}</div>
          <div className="text-[10px] text-text-secondary flex items-center gap-1 truncate">
            <span className="text-sage font-semibold">Hindsight Cloud</span>
            <span className="truncate">{liveStats.bankId}</span>
          </div>
        </motion.div>

        {/* Metric 4: Deterministic Rules Coverage */}
        <motion.div
          variants={fadeInVariants}
          className="bg-surface border border-surface-border rounded p-3.5 space-y-1 shadow-panel"
        >
          <div className="flex items-center justify-between text-text-muted text-[11px]">
            <span>RULE ENFORCEMENT</span>
            <ShieldCheck className="w-3.5 h-3.5 text-sage" />
          </div>
          <div className="text-2xl font-bold text-sage">{deterministicRuleCount} Rules</div>
          <div className="text-[10px] text-text-secondary">
            <span>Deterministic safety floors</span>
          </div>
        </motion.div>
      </div>

      {/* Featured Critical Pre-Flight Assessment Callout */}
      {latestAssessment && (
        <motion.div
          variants={fadeInVariants}
          className="bg-surface border border-risk-critical/40 rounded p-4 lg:p-5 relative overflow-hidden font-sans shadow-panel-elevated"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-surface-border">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-risk-critical opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-risk-critical"></span>
                </span>
                <span className="font-mono text-xs font-semibold text-risk-critical tracking-wide">
                  CRITICAL PRE-FLIGHT INTERCEPTION: RELEASE BLOCKED
                </span>
                <span className="text-text-muted font-mono text-xs">•</span>
                <span className="font-mono text-xs text-text-secondary">{latestAssessment.service}</span>
              </div>
              <h2 className="text-sm font-semibold text-text-primary">
                {latestAssessment.commitMessage}
              </h2>
            </div>

            <div className="flex items-center space-x-3 shrink-0 font-mono">
              <div className="text-right hidden sm:block">
                <div className="text-[10px] text-text-muted">Risk Score</div>
                <div className="text-xl font-bold text-risk-critical">
                  {latestAssessment.riskScore} / 100
                </div>
              </div>
              <Link href={`/deployments/${latestAssessment.id}`}>
                <motion.div
                  whileHover={hoverSubtle}
                  whileTap={tapSubtle}
                  className="px-3.5 py-2 rounded bg-risk-critical text-white text-xs font-mono font-semibold flex items-center space-x-1.5 transition-colors shadow-panel"
                >
                  <span>Inspect Assessment</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </motion.div>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 text-xs font-mono">
            {/* Detection finding */}
            <div className="bg-surface-elevated p-3 rounded border border-surface-border space-y-1">
              <span className="text-text-muted text-[10px] block uppercase tracking-wider font-semibold">
                DETECTED EVIDENCE
              </span>
              <p className="text-text-primary font-sans text-xs">
                {latestAssessment.evidence[0]?.finding}
              </p>
              <span className="text-[10px] text-risk-critical font-mono block">
                Impact: {latestAssessment.evidence[0]?.impactEstimate}
              </span>
            </div>

            {/* Recalled Hindsight Memory */}
            <div className="bg-surface-elevated p-3 rounded border border-signal/30 space-y-1">
              <span className="text-signal text-[10px] flex items-center gap-1 uppercase tracking-wider font-semibold">
                <BrainCircuit className="w-3 h-3" />
                <span>RECALLED HINDSIGHT INCIDENT</span>
              </span>
              <p className="text-text-primary font-sans text-xs">
                {latestAssessment.recalledMemories[0]?.title}
              </p>
              <span className="text-[10px] text-signal font-mono block truncate">
                Similarity: {((latestAssessment.recalledMemories[0]?.similarityScore || 0) * 100).toFixed(1)}% match against {latestAssessment.recalledMemories[0]?.provenance.incidentTicket}
              </span>
            </div>

            {/* Action required */}
            <div className="bg-surface-elevated p-3 rounded border border-surface-border space-y-1">
              <span className="text-text-muted text-[10px] block uppercase tracking-wider font-semibold">
                VERIFICATION GATE
              </span>
              <p className="text-text-primary font-sans text-xs">
                Requires refactoring migration to non-blocking pattern + manual verification sign-off.
              </p>
              <span className="text-[10px] text-risk-warning font-mono block">
                Deployment paused in CI
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Two-Column Layout: Recent Deployments + Recurring Failure Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Deployments (2 cols wide) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xs font-semibold text-text-primary flex items-center gap-2 uppercase tracking-wider font-mono">
                <GitCommit className="w-3.5 h-3.5 text-text-muted" />
                <span>Deployment Register</span>
              </h2>
              <span className="text-[11px] font-mono text-text-muted">
                Correlated pipeline runs across environments
              </span>
            </div>

            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className="text-text-muted text-[11px]">Filter:</span>
              <select
                value={filterEnvironment}
                onChange={(e) => setFilterEnvironment(e.target.value)}
                className="bg-surface-elevated border border-surface-border text-text-secondary text-xs rounded px-2 py-1 font-mono focus:outline-none focus:border-signal/60"
              >
                <option value="ALL">All Environments</option>
                <option value="production">Production</option>
                <option value="staging">Staging</option>
              </select>
            </div>
          </div>

          {/* Deployments Table */}
          <div className="bg-surface border border-surface-border rounded overflow-hidden shadow-panel">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-surface-elevated/80 border-b border-surface-border font-mono text-[10px] text-text-muted uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Service / Release</th>
                    <th className="py-2.5 px-3">Env</th>
                    <th className="py-2.5 px-3">Risk Assessment</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Recency</th>
                    <th className="py-2.5 px-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border font-mono text-text-secondary">
                  {filteredDeployments.map((dep) => (
                    <tr
                      key={dep.id}
                      className="hover:bg-surface-elevated/40 transition-colors group"
                    >
                      <td className="py-2.5 px-3">
                        <div className="flex flex-col font-sans">
                          <span className="font-semibold text-text-primary text-xs group-hover:text-signal transition-colors">
                            {dep.service}
                          </span>
                          <span className="text-[11px] text-text-muted font-mono truncate max-w-[220px]">
                            {dep.version} • {dep.commitHash.substring(0, 8)}
                          </span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-elevated border border-surface-border text-text-secondary uppercase">
                          {dep.environment}
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex items-center space-x-2">
                          <RiskBadge classification={dep.riskClassification} size="sm" />
                          <span className="text-[11px] text-text-muted font-mono">
                            {dep.riskScore}
                          </span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <StatusBadge status={dep.status} />
                      </td>

                      <td className="py-2.5 px-3 text-[11px] text-text-muted">
                        {new Date(dep.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <Link href={`/deployments/${dep.id}`}>
                          <motion.div
                            whileHover={hoverSubtle}
                            whileTap={tapSubtle}
                            className="px-2 py-1 rounded bg-surface-elevated hover:bg-surface-elevated/80 text-text-secondary text-[11px] font-mono border border-surface-border inline-flex items-center space-x-1"
                          >
                            <span>Inspect</span>
                            <ChevronRight className="w-3 h-3 text-text-muted" />
                          </motion.div>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Recurring Failure Categories & Quick Student Guide */}
        <div className="space-y-4">
          {/* Quick DevOps 101 Rules */}
          <div className="bg-gradient-to-br from-surface to-surface-elevated border border-signal/30 rounded-lg p-4 space-y-3 shadow-panel">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-primary flex items-center gap-1.5 font-mono">
                <GraduationCap className="w-4 h-4 text-signal" />
                <span>DevOps 101: 3 Golden Rules</span>
              </span>
              <span className="text-[10px] font-mono text-signal bg-signal/15 px-1.5 py-0.2 rounded border border-signal/30">
                Core Principles
              </span>
            </div>
            <ul className="space-y-2 text-xs font-sans text-text-secondary">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-sage shrink-0 mt-0.5" />
                <span>
                  <strong className="text-text-primary">1. Never Alter Tables Blindly:</strong> Adding NOT NULL columns locks tables and exhausts connection pools.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-sage shrink-0 mt-0.5" />
                <span>
                  <strong className="text-text-primary">2. Remember Every Outage:</strong> Save post-mortems in Hindsight memory so teams never repeat past errors.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-sage shrink-0 mt-0.5" />
                <span>
                  <strong className="text-text-primary">3. The Engineer Always Decides:</strong> AI provides evidence and mitigations; humans make the final call.
                </span>
              </li>
            </ul>

            <div className="pt-2 border-t border-surface-border/60 flex items-center justify-between font-mono text-[11px]">
              <button
                type="button"
                onClick={() => setIsFlowModalOpen(true)}
                className="text-signal hover:underline inline-flex items-center gap-1"
              >
                <Workflow className="w-3 h-3" />
                <span>See Architecture Flow</span>
              </button>
              <button
                type="button"
                onClick={() => setIsGlossaryModalOpen(true)}
                className="text-text-muted hover:text-text-primary inline-flex items-center gap-1"
              >
                <BookOpen className="w-3 h-3" />
                <span>Glossary</span>
              </button>
            </div>
          </div>

          <div>
            <h2 className="text-xs font-semibold text-text-primary flex items-center gap-2 uppercase tracking-wider font-mono">
              <TrendingDown className="w-3.5 h-3.5 text-risk-warning" />
              <span>Recurring Failure Categories</span>
            </h2>
            <span className="text-[11px] font-mono text-text-muted">
              Pattern trends indexed in Hindsight memory
            </span>
          </div>

          <div className="space-y-2">
            {mockRecurringFailureCategories.map((cat) => (
              <div
                key={cat.id}
                className="bg-surface border border-surface-border rounded p-3 space-y-1.5 hover:border-surface-border/80 transition-colors shadow-panel"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-text-primary">
                    {cat.category}
                  </span>
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${
                      cat.blastRadius === "HIGH"
                        ? "bg-risk-critical/15 text-risk-critical border-risk-critical/40"
                        : "bg-risk-warning/15 text-risk-warning border-risk-warning/40"
                    }`}
                  >
                    {cat.blastRadius} IMPACT
                  </span>
                </div>

                <p className="text-[11px] text-text-secondary leading-relaxed font-sans">
                  {cat.description}
                </p>

                <div className="flex items-center justify-between text-[10px] font-mono text-text-muted pt-1 border-t border-surface-border/40">
                  <span>{cat.incidentCount} incidents recorded</span>
                  <span>MTTR: {cat.averageRecoveryMinutes}m</span>
                  <span className="text-sage font-medium">{cat.trend}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Hindsight Memory Bank Shortcut */}
          <div className="bg-surface-elevated/60 border border-signal/30 rounded p-3.5 space-y-2 font-mono text-xs shadow-panel">
            <div className="flex items-center space-x-2 text-signal font-semibold">
              <BrainCircuit className="w-4 h-4 text-signal" />
              <span>Hindsight Memory Bank</span>
            </div>
            <p className="text-text-secondary font-sans text-xs">
              Continuous retrospective memory learns from every post-mortem and protects upcoming releases.
            </p>
            <Link
              href="/memories"
              className="text-signal hover:text-white inline-flex items-center gap-1 text-[11px] pt-1"
            >
              <span>Explore Memory Bank ({verifiedPrecedentsCount} Indexed)</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
