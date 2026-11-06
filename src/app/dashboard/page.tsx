"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  GitCommit,
  BrainCircuit,
  TrendingDown,
  ArrowRight,
  Server,
  AlertTriangle,
  CheckCircle,
  Clock,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Filter,
} from "lucide-react";
import { mockDeployments, mockRecurringFailureCategories } from "@/data/mockData";
import { RiskBadge, StatusBadge } from "@/components/ui/StatusBadge";
import { RiskGauge } from "@/components/ui/RiskGauge";

export default function DashboardPage() {
  const [filterEnvironment, setFilterEnvironment] = useState<string>("ALL");

  const totalDeployments = 142;
  const criticalBlockedCount = mockDeployments.filter((d) => d.status === "blocked").length;
  const preventedIncidentsCount = 58;
  const avgAssessmentMs = 42;

  const filteredDeployments =
    filterEnvironment === "ALL"
      ? mockDeployments
      : mockDeployments.filter((d) => d.environment.toLowerCase() === filterEnvironment.toLowerCase());

  const latestAssessment = mockDeployments[0]; // dep-prod-9402

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Page Title & System Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-surface-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
            <span>Release Engineering Dashboard</span>
            <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-surface-subtle text-zinc-400 border border-surface-border">
              TELEMETRY V2.4
            </span>
          </h1>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">
            Real-time pre-flight risk intelligence & Hindsight incident memory recall
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Link
            href="/learning-lab"
            className="px-3 py-1.5 rounded bg-brand-hindsight/20 hover:bg-brand-hindsight/30 text-purple-300 border border-brand-hindsight/50 text-xs font-mono font-medium flex items-center space-x-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Interactive Learning Lab</span>
          </Link>
          <Link
            href="/deployments"
            className="px-3 py-1.5 rounded bg-surface-subtle hover:bg-surface-border text-zinc-200 border border-surface-border text-xs font-mono font-medium flex items-center space-x-1 transition-colors"
          >
            <span>View All Releases</span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
        {/* KPI 1: Total Releases */}
        <div className="bg-surface border border-surface-border rounded-lg p-3.5 space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-[11px]">
            <span>WEEKLY DEPLOYMENTS</span>
            <GitCommit className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-100">{totalDeployments}</div>
          <div className="text-[10px] text-zinc-400 flex items-center space-x-1">
            <span className="text-emerald-400 font-semibold">+18.4%</span>
            <span>vs previous week</span>
          </div>
        </div>

        {/* KPI 2: Blocked At Risk */}
        <div className="bg-surface border border-surface-border rounded-lg p-3.5 space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-[11px]">
            <span>HAZARDOUS BLOCKED</span>
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400">{criticalBlockedCount}</div>
          <div className="text-[10px] text-zinc-400 flex items-center space-x-1">
            <span className="text-red-400 font-semibold">1 Critical</span>
            <span>• 1 At Risk</span>
          </div>
        </div>

        {/* KPI 3: Incidents Prevented via Hindsight */}
        <div className="bg-surface border border-surface-border rounded-lg p-3.5 space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-[11px]">
            <span>OUTAGES PREVENTED</span>
            <BrainCircuit className="w-3.5 h-3.5 text-brand-hindsight" />
          </div>
          <div className="text-2xl font-bold text-brand-hindsight">
            {preventedIncidentsCount}
          </div>
          <div className="text-[10px] text-zinc-400 flex items-center space-x-1">
            <span className="text-purple-300 font-semibold">100% matched</span>
            <span>via memory bank</span>
          </div>
        </div>

        {/* KPI 4: Mean Assessment Latency */}
        <div className="bg-surface border border-surface-border rounded-lg p-3.5 space-y-1">
          <div className="flex items-center justify-between text-zinc-500 text-[11px]">
            <span>ASSESSMENT LATENCY</span>
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{avgAssessmentMs}ms</div>
          <div className="text-[10px] text-zinc-400">
            <span>Pre-flight CI gate latency</span>
          </div>
        </div>
      </div>

      {/* Featured Critical Pre-Flight Assessment Callout */}
      {latestAssessment && (
        <div className="bg-surface border border-red-900/60 rounded-lg p-4 lg:p-5 relative overflow-hidden font-sans shadow-technical-md">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-surface-border">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="font-mono text-xs font-semibold text-red-400 tracking-wide">
                  CRITICAL PRE-FLIGHT INTERCEPTION: RELEASE BLOCKED
                </span>
                <span className="text-zinc-500 font-mono text-xs">•</span>
                <span className="font-mono text-xs text-zinc-300">{latestAssessment.service}</span>
              </div>
              <h2 className="text-base font-semibold text-zinc-100">
                {latestAssessment.commitMessage}
              </h2>
            </div>

            <div className="flex items-center space-x-3 shrink-0 font-mono">
              <div className="text-right hidden sm:block">
                <div className="text-xs text-zinc-400">Risk Score</div>
                <div className="text-xl font-bold text-red-400">
                  {latestAssessment.riskScore} / 100
                </div>
              </div>
              <Link
                href={`/deployments/${latestAssessment.id}`}
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-semibold flex items-center space-x-1.5 transition-colors shadow-glow-critical"
              >
                <span>Inspect Full Assessment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs font-mono">
            {/* Detection finding */}
            <div className="bg-surface-subtle p-3 rounded border border-surface-border space-y-1">
              <span className="text-zinc-500 text-[11px] block">DETECTED EVIDENCE</span>
              <p className="text-zinc-200 font-sans text-xs">
                {latestAssessment.evidence[0]?.finding}
              </p>
              <span className="text-[10px] text-red-400 font-mono block">
                Impact: {latestAssessment.evidence[0]?.impactEstimate}
              </span>
            </div>

            {/* Recalled Hindsight Memory */}
            <div className="bg-purple-950/20 p-3 rounded border border-purple-800/40 space-y-1">
              <span className="text-purple-400 text-[11px] flex items-center gap-1">
                <BrainCircuit className="w-3 h-3" />
                <span>RECALLED HINDSIGHT INCIDENT</span>
              </span>
              <p className="text-zinc-200 font-sans text-xs">
                {latestAssessment.recalledMemories[0]?.title}
              </p>
              <span className="text-[10px] text-purple-300 font-mono block">
                Similarity: {( (latestAssessment.recalledMemories[0]?.similarityScore || 0) * 100).toFixed(1)}% match against {latestAssessment.recalledMemories[0]?.provenance.incidentTicket}
              </span>
            </div>

            {/* Action required */}
            <div className="bg-surface-subtle p-3 rounded border border-surface-border space-y-1">
              <span className="text-zinc-500 text-[11px] block">VERIFICATION GATE</span>
              <p className="text-zinc-200 font-sans text-xs">
                Requires refactoring migration to non-blocking pattern + Staff Engineer override.
              </p>
              <span className="text-[10px] text-amber-400 font-mono block">
                Deployment paused in CI
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Two-Column Layout: Recent Deployments + Recurring Failure Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Deployments (2 cols wide) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <GitCommit className="w-4 h-4 text-zinc-400" />
                <span>Recent Deployment Runs</span>
              </h2>
              <span className="text-[11px] font-mono text-zinc-500">
                Monitored pipeline runs across all environments
              </span>
            </div>

            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className="text-zinc-500">Filter:</span>
              <select
                value={filterEnvironment}
                onChange={(e) => setFilterEnvironment(e.target.value)}
                className="bg-surface-subtle border border-surface-border text-zinc-300 text-xs rounded px-2 py-1"
              >
                <option value="ALL">All Environments</option>
                <option value="production">Production</option>
                <option value="staging">Staging</option>
              </select>
            </div>
          </div>

          {/* Deployments Table */}
          <div className="bg-surface border border-surface-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-surface-subtle border-b border-surface-border font-mono text-[11px] text-zinc-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Service / Release</th>
                    <th className="py-2.5 px-3">Env</th>
                    <th className="py-2.5 px-3">Risk Assessment</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Recency</th>
                    <th className="py-2.5 px-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border font-mono text-zinc-300">
                  {filteredDeployments.map((dep) => (
                    <tr
                      key={dep.id}
                      className="hover:bg-surface-subtle/60 transition-colors group"
                    >
                      <td className="py-3 px-3">
                        <div className="flex flex-col font-sans">
                          <span className="font-semibold text-zinc-100 text-xs group-hover:text-brand-hindsight transition-colors">
                            {dep.service}
                          </span>
                          <span className="text-[11px] text-zinc-400 font-mono truncate max-w-[200px]">
                            {dep.version} • {dep.commitHash}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-surface-subtle border border-surface-border text-zinc-300">
                          {dep.environment}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2">
                          <RiskBadge classification={dep.riskClassification} size="sm" />
                          <span className="text-[11px] text-zinc-500 font-mono">
                            {dep.riskScore}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <StatusBadge status={dep.status} />
                      </td>

                      <td className="py-3 px-3 text-[11px] text-zinc-400">
                        {new Date(dep.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <Link
                          href={`/deployments/${dep.id}`}
                          className="px-2 py-1 rounded bg-surface-subtle hover:bg-surface-border text-zinc-300 text-[11px] font-mono border border-surface-border inline-flex items-center space-x-1"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="w-3 h-3 text-zinc-500" />
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
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-amber-400" />
              <span>Recurring Failure Categories</span>
            </h2>
            <span className="text-[11px] font-mono text-zinc-500">
              Pattern trends indexed in Hindsight memory
            </span>
          </div>

          <div className="space-y-2.5">
            {mockRecurringFailureCategories.map((cat) => (
              <div
                key={cat.id}
                className="bg-surface border border-surface-border rounded-lg p-3 space-y-2 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-zinc-200">
                    {cat.category}
                  </span>
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${
                      cat.blastRadius === "HIGH"
                        ? "bg-red-950/50 text-red-400 border-red-800"
                        : "bg-amber-950/40 text-amber-400 border-amber-800"
                    }`}
                  >
                    {cat.blastRadius} IMPACT
                  </span>
                </div>

                <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                  {cat.description}
                </p>

                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-1 border-t border-surface-border/50">
                  <span>{cat.incidentCount} incidents recorded</span>
                  <span>Avg Outage: {cat.averageRecoveryMinutes}m</span>
                  <span className="text-emerald-400">{cat.trend}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Hindsight Memory Bank Shortcut */}
          <div className="bg-gradient-to-br from-purple-950/40 to-surface border border-purple-800/40 rounded-lg p-3.5 space-y-2 font-mono text-xs">
            <div className="flex items-center space-x-2 text-purple-300 font-semibold">
              <BrainCircuit className="w-4 h-4 text-purple-400" />
              <span>Hindsight Memory Bank</span>
            </div>
            <p className="text-zinc-400 font-sans text-xs">
              Continuous retrospective memory learns from every post-mortem and protects upcoming releases.
            </p>
            <Link
              href="/memories"
              className="text-purple-300 hover:text-white inline-flex items-center gap-1 text-[11px] pt-1"
            >
              <span>Explore Memory Bank (5 Indexed)</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
