"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ShieldAlert,
  GitCommit,
  BrainCircuit,
  TrendingDown,
  Minus,
  ArrowRight,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { mockDeployments, mockRecurringFailureCategories } from "@/data/mockData";
import { RiskBadge, StatusBadge } from "@/components/ui/StatusBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  fadeInVariants,
  staggerContainer,
  hoverSubtle,
  tapSubtle,
} from "@/lib/motion";

export default function DashboardPage() {
  const [filterEnvironment, setFilterEnvironment] = useState<string>("ALL");

  const totalMonitoredDeployments = mockDeployments.length;
  const criticalBlockedCount = mockDeployments.filter((d) => d.status === "blocked").length;
  const verifiedPrecedentsCount = 5; // Verified indexed failure memories in bank
  const deterministicRuleCount = 8; // Deterministic risk checks active

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
      className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto w-full"
    >
      {/* Page Title & System Status Banner */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-sage animate-pulse"></span>
          <span className="font-mono text-[10px] uppercase tracking-wider font-semibold text-text-muted">
            Telemetry Engine
          </span>
        </div>
        <PageHeader
          title="Release Operations Overview"
          subtitle="Deterministic pre-flight risk classification, Prisma migration analysis, and Hindsight incident recall."
          badge={
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sage-subtle border border-sage/30 text-sage font-mono text-[10px] uppercase tracking-wider font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-sage"></span>
              Engine Active
            </span>
          }
          actions={
            <div className="flex items-center gap-2">
              <Link href="/learning-lab">
                <motion.div
                  whileHover={hoverSubtle}
                  whileTap={tapSubtle}
                  className="px-3.5 py-2 rounded-lg bg-surface hover:bg-surface-subtle text-text-primary border border-surface-border text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-panel-subtle"
                >
                  <Sparkles className="w-4 h-4 text-signal" />
                  <span>Interactive Learning Lab</span>
                </motion.div>
              </Link>
              <Link href="/deployments">
                <motion.div
                  whileHover={hoverSubtle}
                  whileTap={tapSubtle}
                  className="px-3.5 py-2 rounded-lg bg-surface-subtle hover:bg-surface-overlay text-text-secondary hover:text-text-primary border border-surface-border text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  <span>Deployment Register</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </motion.div>
              </Link>
            </div>
          }
        />
      </div>

      {/* Primary Operational Metric Cards — Stitch 2x2 telemetry grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {/* Metric 1: Monitored Deployments */}
        <motion.div
          variants={fadeInVariants}
          className="bg-surface border border-surface-border rounded-lg p-3.5 shadow-panel-subtle flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-text-muted">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider">Active Runs</span>
            <GitCommit className="w-[17px] h-[17px] text-signal" />
          </div>
          <div className="my-1.5 flex items-baseline gap-1.5">
            <span className="text-[28px] leading-none font-bold text-text-primary tracking-tight">{totalMonitoredDeployments}</span>
            <span className="font-mono text-[11px] font-semibold text-sage bg-sage-subtle px-1.5 py-0.5 rounded">live</span>
          </div>
          <p className="font-mono text-[10px] text-text-muted leading-tight">Vercel &amp; Neon targets correlated</p>
        </motion.div>

        {/* Metric 2: Interceptions / Blocked */}
        <motion.div
          variants={fadeInVariants}
          className="bg-surface border border-red-200 rounded-lg p-3.5 shadow-panel-subtle flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-white to-red-50/40"
        >
          <div className="flex items-center justify-between text-red-700">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider">Interceptions</span>
            <ShieldAlert className="w-[17px] h-[17px] text-red-600" />
          </div>
          <div className="my-1.5 flex items-baseline gap-1.5">
            <span className="text-[28px] leading-none font-bold text-red-600 tracking-tight">{criticalBlockedCount}</span>
            <span className="font-mono text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded uppercase">Gate Block</span>
          </div>
          <p className="font-mono text-[10px] text-text-muted leading-tight">1 Critical • Pre-flight CI Gate</p>
        </motion.div>

        {/* Metric 3: Verified Precedents Recalled */}
        <motion.div
          variants={fadeInVariants}
          className="bg-surface border border-surface-border rounded-lg p-3.5 shadow-panel-subtle flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-text-muted">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider">Retained Memories</span>
            <BrainCircuit className="w-[17px] h-[17px] text-signal" />
          </div>
          <div className="my-1.5 flex items-baseline gap-1.5">
            <span className="text-[28px] leading-none font-bold text-text-primary tracking-tight">{verifiedPrecedentsCount}</span>
            <span className="font-mono text-[11px] font-semibold text-signal bg-signal/10 px-1.5 py-0.5 rounded">100%</span>
          </div>
          <p className="font-mono text-[10px] text-text-muted leading-tight">Verified Hindsight memory bank</p>
        </motion.div>

        {/* Metric 4: Deterministic Rules Coverage */}
        <motion.div
          variants={fadeInVariants}
          className="bg-surface border border-surface-border rounded-lg p-3.5 shadow-panel-subtle flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-text-muted">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider">Rule Enforcement</span>
            <ShieldCheck className="w-[17px] h-[17px] text-sage" />
          </div>
          <div className="my-1.5 flex items-baseline gap-1.5">
            <span className="text-[28px] leading-none font-bold text-text-primary tracking-tight">{deterministicRuleCount}</span>
            <span className="font-mono text-[10px] font-semibold text-text-secondary bg-surface-subtle border border-surface-border px-1.5 py-0.5 rounded uppercase">Rules</span>
          </div>
          <p className="font-mono text-[10px] text-text-muted leading-tight">Deterministic pre-flight checks</p>
        </motion.div>
      </div>

      {/* Featured Critical Pre-Flight Assessment Callout — Stitch red hero card */}
      {latestAssessment && (
        <motion.div
          variants={fadeInVariants}
          className="bg-red-50/70 border border-red-200 rounded-lg p-4 lg:p-5 relative overflow-hidden shadow-panel-subtle"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-red-600"></div>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-red-200/70 pt-0.5">
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
                </span>
                <span className="font-mono text-[11px] font-bold text-red-700 tracking-wider uppercase">
                  Critical Pre-flight Interception
                </span>
                <span className="px-2 py-0.5 rounded bg-white/90 border border-red-200 font-mono text-[11px] font-semibold text-text-secondary">
                  {latestAssessment.service}
                </span>
              </div>
              <h2 className="text-[15px] font-semibold text-text-primary leading-snug tracking-tight">
                {latestAssessment.commitMessage}
              </h2>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="flex flex-col p-2.5 px-3 rounded-lg bg-white border border-red-200/80 shadow-panel-subtle">
                <span className="font-mono text-[10px] uppercase font-semibold text-text-muted">Risk Score</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-red-600">{latestAssessment.riskScore}</span>
                  <span className="font-mono text-[11px] text-text-muted">/ 100</span>
                </div>
              </div>
              <Link href={`/deployments/${latestAssessment.id}`}>
                <motion.div
                  whileHover={hoverSubtle}
                  whileTap={tapSubtle}
                  className="px-3.5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-panel-subtle"
                >
                  <span>Inspect Assessment</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </motion.div>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 text-xs">
            {/* Detection finding */}
            <div className="bg-white p-3 rounded-lg border border-red-200/80 space-y-1 shadow-panel-subtle">
              <span className="text-text-muted font-mono text-[10px] font-semibold block uppercase tracking-wider">
                Detected Evidence
              </span>
              <p className="text-text-primary text-xs leading-relaxed">
                {latestAssessment.evidence[0]?.finding}
              </p>
              <span className="text-[10px] text-red-700 font-mono block">
                Impact: {latestAssessment.evidence[0]?.impactEstimate}
              </span>
            </div>

            {/* Recalled Hindsight Memory */}
            <div className="bg-white p-3 rounded-lg border border-signal/30 space-y-1 shadow-panel-subtle">
              <span className="text-signal font-mono text-[10px] font-semibold flex items-center gap-1 uppercase tracking-wider">
                <BrainCircuit className="w-3 h-3" />
                <span>Recalled Hindsight Incident</span>
              </span>
              <p className="text-text-primary text-xs leading-relaxed">
                {latestAssessment.recalledMemories[0]?.title}
              </p>
              <span className="text-[10px] text-signal font-mono block">
                Similarity: {((latestAssessment.recalledMemories[0]?.similarityScore || 0) * 100).toFixed(1)}% match against {latestAssessment.recalledMemories[0]?.provenance.incidentTicket}
              </span>
            </div>

            {/* Action required */}
            <div className="bg-white p-3 rounded-lg border border-surface-border space-y-1 shadow-panel-subtle">
              <span className="text-text-muted font-mono text-[10px] font-semibold block uppercase tracking-wider">
                Verification Gate
              </span>
              <p className="text-text-primary text-xs leading-relaxed">
                Requires refactoring migration to non-blocking pattern + manual verification sign-off.
              </p>
              <span className="text-[10px] text-risk-high font-mono block">
                Deployment paused in CI
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Two-Column Layout: Recent Deployments + Recurring Failure Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Deployments (2 cols wide) */}
        <div className="lg:col-span-2 space-y-3" id="deployments">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-text-primary flex items-center gap-2 tracking-tight">
                <GitCommit className="w-4 h-4 text-signal" />
                <span>Deployment Register</span>
              </h2>
              <span className="text-xs text-text-secondary">
                Correlated pipeline runs across environments
              </span>
            </div>

            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className="text-text-muted text-[11px]">Filter:</span>
              <select
                value={filterEnvironment}
                onChange={(e) => setFilterEnvironment(e.target.value)}
                className="bg-surface border border-surface-border text-text-secondary text-xs rounded-full px-2.5 py-1.5 font-mono focus:outline-none focus:border-signal/60 cursor-pointer"
              >
                <option value="ALL">All Environments</option>
                <option value="production">Production</option>
                <option value="staging">Staging</option>
              </select>
            </div>
          </div>

          {/* Deployments Table — white Stitch card */}
          <div className="bg-surface border border-surface-border rounded-lg overflow-hidden shadow-panel-subtle">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-surface-subtle border-b border-surface-border font-mono text-[10px] text-text-muted uppercase tracking-wider">
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
                      className="hover:bg-brand-subtle/60 transition-colors group"
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
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-subtle border border-surface-border text-text-secondary">
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
                          <motion.span
                            whileHover={hoverSubtle}
                            whileTap={tapSubtle}
                            className="px-2 py-1 rounded-lg bg-surface hover:bg-surface-subtle text-text-secondary hover:text-signal text-[11px] font-mono font-semibold inline-flex items-center space-x-1 transition-colors"
                          >
                            <span>Inspect</span>
                            <ChevronRight className="w-3 h-3" />
                          </motion.span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Recurring Failure Categories & Memory Recalls */}
        <div className="space-y-3">
          <div>
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2 tracking-tight">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <span>Recurring Failure Categories</span>
            </h2>
            <span className="text-xs text-text-secondary">
              Pattern trends indexed in Hindsight memory
            </span>
          </div>

          <div className="space-y-2.5">
            {mockRecurringFailureCategories.map((cat) => (
              <div
                key={cat.id}
                className="bg-surface border border-surface-border rounded-lg p-3.5 space-y-1.5 hover:shadow-panel-elevated transition-shadow shadow-panel-subtle"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-[13px] text-text-primary leading-snug">
                    {cat.category}
                  </span>
                  <span
                    className={`font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
                      cat.blastRadius === "HIGH"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {cat.blastRadius} IMPACT
                  </span>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed font-sans">
                  {cat.description}
                </p>

                <div className="flex items-center justify-between text-[10px] font-mono text-text-muted pt-1.5 border-t border-surface-border/70">
                  <span>{cat.incidentCount} incidents recorded</span>
                  <span>MTTR: {cat.averageRecoveryMinutes}m</span>
                  <span className={`flex items-center gap-1 font-semibold ${cat.trend === "DECREASING" ? "text-sage" : "text-text-muted"}`}>
                    {cat.trend === "DECREASING" ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                    {cat.trend}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Hindsight Memory Bank Shortcut — Stitch teal-tint card */}
          <div className="bg-brand-subtle border border-signal/25 rounded-lg p-4 space-y-2 shadow-panel-subtle">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-lg bg-signal/10 flex items-center justify-center shrink-0">
                <BrainCircuit className="w-5 h-5 text-signal" />
              </div>
              <span className="font-semibold text-sm text-text-primary">Hindsight Memory Bank</span>
            </div>
            <p className="text-text-secondary font-sans text-xs leading-relaxed">
              Continuous retrospective memory learns from every post-mortem and protects upcoming releases.
            </p>
            <Link
              href="/memories"
              className="flex items-center justify-between gap-1 text-xs font-semibold text-signal bg-surface border border-surface-border rounded-lg px-3 py-2.5 hover:bg-surface-subtle transition-colors"
            >
              <span>Explore Memory Bank (5 Indexed)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
