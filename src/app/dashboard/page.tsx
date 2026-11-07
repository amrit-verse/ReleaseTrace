"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { mockDeployments, mockRecurringFailureCategories } from "@/data/mockData";
import { PlainEnglishCallout } from "@/components/ui/PlainEnglishCallout";
import { FirstTimeDeployerGuide } from "@/components/ui/FirstTimeDeployerGuide";
import { useDevOpsGuide } from "@/context/DevOpsGuideContext";
import { fadeInVariants, staggerContainer } from "@/lib/motion";

export default function DashboardPage() {
  const [filterEnvironment, setFilterEnvironment] = useState<string>("ALL");
  const { setIsSimulatorModalOpen } = useDevOpsGuide();

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
    totalDeployments: 6,
    activeAssessments: 6,
    criticalBlockedCount: 2,
    verifiedPrecedentsCount: 5,
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

  const totalMonitoredDeployments = liveStats.totalDeployments || mockDeployments.length;
  const criticalBlockedCount = liveStats.criticalBlockedCount || 2;
  const verifiedPrecedentsCount = liveStats.verifiedPrecedentsCount || 5;
  const deterministicRuleCount = liveStats.deterministicRuleCount || 8;

  const filteredDeployments =
    filterEnvironment === "ALL"
      ? mockDeployments
      : mockDeployments.filter(
          (d) => d.environment.toLowerCase() === filterEnvironment.toLowerCase()
        );

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto w-full"
    >
      {/* Page Header & Quick Controls */}
      <section className="flex flex-col gap-2 pt-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
            <span className="font-mono text-[10px] uppercase tracking-wider font-bold text-slate-500">
              Liquid Telemetry Engine
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full liquid-glass-pill border-emerald-300 text-emerald-800 bg-emerald-50/70 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            <span className="font-mono text-[10px] uppercase tracking-wider font-bold">
              Engine Active
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <h1 className="text-[26px] lg:text-[28px] font-extrabold text-slate-900 tracking-tight leading-tight">
            Release Operations Overview
          </h1>
          <p className="text-[13px] text-slate-600 leading-snug">
            Deterministic pre-flight risk classification, Prisma migration analysis, and Hindsight incident recall.
          </p>
        </div>

        {/* Quick Action Pill Group */}
        <div className="flex items-center gap-2.5 mt-1 overflow-x-auto no-scrollbar pb-1">
          <Link
            href="/learning-lab"
            className="flex items-center gap-2 px-4 py-2 rounded-full btn-catchy-primary active:scale-95 transition-all flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[17px] text-amber-300">auto_awesome</span>
            <span className="text-[12px] font-bold text-white">Interactive Learning Lab</span>
          </Link>
          <Link
            href="/deployments"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full liquid-glass-pill text-slate-700 hover:text-slate-900 active:scale-95 transition-all flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-600">rocket_launch</span>
            <span className="text-[12px] font-semibold">Deployment Register</span>
            <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
          </Link>
          <Link
            href="/memories"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full liquid-glass-pill text-slate-700 hover:text-slate-900 active:scale-95 transition-all flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">psychology</span>
            <span className="text-[12px] font-semibold">Memory Bank</span>
          </Link>
          <button
            type="button"
            onClick={() => setIsSimulatorModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full liquid-glass-pill text-sky-600 hover:text-sky-800 border border-sky-300 active:scale-95 transition-all flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">bolt</span>
            <span className="text-[12px] font-semibold">Test Sandbox</span>
          </button>
        </div>
      </section>

      {/* 2x2 Telemetry Stat Cards Grid with Liquid Glass Refraction */}
      <section aria-label="Core Metrics" className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Stat 1: Active Runs */}
        <motion.div
          variants={fadeInVariants}
          className="flex flex-col justify-between p-4 rounded-2xl liquid-glass-card shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Active Runs</span>
            <div className="w-8 h-8 rounded-xl liquid-glass-pill bg-sky-50/80 border-sky-200 flex items-center justify-center text-sky-600 shadow-sm">
              <span className="material-symbols-outlined text-[17px]">hub</span>
            </div>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-[30px] font-extrabold text-slate-900 tracking-tight">{totalMonitoredDeployments}</span>
            <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50/90 border border-emerald-300 px-2 py-0.5 rounded-full uppercase shadow-xs">
              live
            </span>
          </div>
          <p className="font-mono text-[10px] text-slate-500 leading-tight truncate">
            Vercel &amp; Neon targets correlated
          </p>
        </motion.div>

        {/* Stat 2: Interceptions */}
        <motion.div
          variants={fadeInVariants}
          className="flex flex-col justify-between p-4 rounded-2xl liquid-glass-card border-rose-300/80 bg-rose-50/40 shadow-sm"
        >
          <div className="flex items-center justify-between text-rose-700">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Interceptions</span>
            <div className="w-8 h-8 rounded-xl liquid-glass-pill border-rose-200 bg-rose-50 flex items-center justify-center text-rose-600 shadow-sm">
              <span className="material-symbols-outlined text-[17px]">gpp_bad</span>
            </div>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-[30px] font-extrabold text-rose-600 tracking-tight">{criticalBlockedCount}</span>
            <span className="font-mono text-[10px] font-bold text-rose-700 bg-rose-50/90 border border-rose-300 px-2 py-0.5 rounded-full uppercase shadow-xs">
              Gate Block
            </span>
          </div>
          <p className="font-mono text-[10px] text-slate-500 leading-tight truncate">
            1 Critical • Pre-flight CI Gate
          </p>
        </motion.div>

        {/* Stat 3: Retained Memories */}
        <motion.div
          variants={fadeInVariants}
          className="flex flex-col justify-between p-4 rounded-2xl liquid-glass-card shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Retained Memories</span>
            <div className="w-8 h-8 rounded-xl liquid-glass-pill bg-indigo-50/80 border-indigo-200 flex items-center justify-center text-indigo-600 shadow-sm">
              <span className="material-symbols-outlined text-[17px]">psychology</span>
            </div>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-[30px] font-extrabold text-slate-900 tracking-tight">{verifiedPrecedentsCount}</span>
            <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full shadow-xs">
              100%
            </span>
          </div>
          <p className="font-mono text-[10px] text-slate-500 leading-tight truncate">
            Verified Hindsight memory bank
          </p>
        </motion.div>

        {/* Stat 4: Rule Enforcement */}
        <motion.div
          variants={fadeInVariants}
          className="flex flex-col justify-between p-4 rounded-2xl liquid-glass-card shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Rule Enforcement</span>
            <div className="w-8 h-8 rounded-xl liquid-glass-pill bg-emerald-50/80 border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm">
              <span className="material-symbols-outlined text-[17px]">shield</span>
            </div>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-[30px] font-extrabold text-slate-900 tracking-tight">{deterministicRuleCount}</span>
            <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50/90 border border-emerald-300 px-2 py-0.5 rounded-full uppercase shadow-xs">
              rules
            </span>
          </div>
          <p className="font-mono text-[10px] text-slate-500 leading-tight truncate">
            Deterministic pre-flight checks
          </p>
        </motion.div>
      </section>

      {/* CRITICAL INTERCEPTION CARD HERO CALLOUT (Liquid Glass) */}
      <motion.section
        variants={fadeInVariants}
        className="flex flex-col rounded-2xl liquid-glass-critical p-5 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-rose-500 to-red-600"></div>
        {/* Top banner strip */}
        <div className="flex items-start justify-between gap-2 mb-2 pt-0.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-3 w-3 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600 shadow-md"></span>
            </span>
            <span className="font-mono text-[11px] font-bold text-red-700 tracking-wider uppercase truncate">
              Critical Pre-flight Interception
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="px-2.5 py-0.5 rounded-full liquid-glass-pill border-red-300 font-mono text-[11px] font-bold text-slate-800">
              auth-gateway
            </span>
            <button
              type="button"
              aria-label="Filter gateway settings"
              className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">tune</span>
            </button>
          </div>
        </div>

        {/* Incident Title */}
        <h2 className="text-[16px] font-bold text-slate-900 leading-snug tracking-tight mb-3">
          feat(auth): add passkey biometric verification and session metadata table migration
        </h2>

        {/* Score metric + CTA Bar (Glass Pill Bar) */}
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl liquid-glass-subtile mb-3">
          <div className="flex flex-col">
            <span className="font-mono text-[10px] uppercase font-bold text-slate-500">Risk Score</span>
            <div className="flex items-baseline gap-1">
              <span className="text-[22px] font-extrabold text-red-600">92</span>
              <span className="font-mono text-[11px] text-slate-500 font-medium">/ 100</span>
            </div>
          </div>
          <Link
            href="/deployments/dep-prod-9402"
            className="flex items-center justify-center gap-1.5 px-5 h-10 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 active:scale-95 text-white font-bold text-[12px] transition-all shadow-md shadow-red-500/25 hover:shadow-lg hover:shadow-red-500/35 hover:-translate-y-0.5"
          >
            <span>Inspect Assessment</span>
            <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
          </Link>
        </div>

        {/* Nested Diagnostics Accordion Blocks (Liquid Glass Subtiles) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Evidence 1 */}
          <div className="p-3.5 rounded-xl liquid-glass-subtile flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-primary">
              <span className="material-symbols-outlined text-[16px]">database</span>
              <span className="font-mono text-[10px] uppercase tracking-wider font-bold">Detected Evidence</span>
            </div>
            <p className="text-[13px] font-semibold text-slate-800 leading-snug">
              Table rewrite lock detected on table with 49.8M rows
            </p>
            <p className="text-[11px] text-red-600 font-medium leading-snug mt-auto">
              Impact: Estimated 5.2 minutes total downtime for all authentication routes.
            </p>
          </div>

          {/* Evidence 2 (Hindsight Incident) */}
          <div className="p-3.5 rounded-xl liquid-glass-subtile flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-primary">
                <span className="material-symbols-outlined text-[16px]">history</span>
                <span className="font-mono text-[10px] uppercase tracking-wider font-bold">Recalled Incident</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[10px] font-bold border border-emerald-300">
                94.0% MATCH
              </span>
            </div>
            <p className="text-[13px] font-semibold text-slate-800 leading-snug">
              Postgres Table Rewrite Outage during User Schema Migration
            </p>
            <span className="font-mono text-[10px] text-slate-500 mt-auto">
              Referenced root cause: INC-8842
            </span>
          </div>

          {/* Evidence 3 (Verification Gate) */}
          <div className="p-3.5 rounded-xl liquid-glass-subtile border-amber-300/80 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-amber-800">
              <span className="material-symbols-outlined text-[16px]">lock</span>
              <span className="font-mono text-[10px] uppercase tracking-wider font-bold">Verification Gate</span>
            </div>
            <p className="text-[12px] text-slate-700 leading-snug">
              Requires refactoring migration to non-blocking pattern + manual verification sign-off.
            </p>
            <div className="flex items-center gap-1 font-mono text-[11px] text-red-700 font-bold mt-auto">
              <span className="material-symbols-outlined text-[14px]">pause_circle</span>
              <span>Deployment paused in CI</span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Visual Storytelling: Pre-flight Pressure Matrix (Liquid Glass) */}
      <motion.section
        variants={fadeInVariants}
        className="flex flex-col p-5 rounded-2xl liquid-glass-card gap-3.5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[19px] text-primary">tune</span>
            <span className="text-[15px] font-bold text-slate-900">Pre-flight Pressure Matrix</span>
          </div>
          <span className="font-mono text-[10px] text-slate-500 uppercase font-bold">
            Correlated Shards
          </span>
        </div>

        {/* Sparkline / telemetry visual */}
        <div className="w-full h-20 relative flex items-end justify-between px-3 pt-3 rounded-xl liquid-glass-subtile overflow-hidden">
          <svg className="w-full h-16 text-primary" fill="none" preserveAspectRatio="none" viewBox="0 0 100 30">
            <path
              d="M0 24 Q 15 20, 25 22 T 50 14 T 70 26 T 85 4 T 100 28"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2.5"
            />
            <path
              d="M0 24 Q 15 20, 25 22 T 50 14 T 70 26 T 85 4 T 100 28 L 100 30 L 0 30 Z"
              fill="rgba(245, 158, 11, 0.16)"
            />
          </svg>
          <div className="absolute top-2.5 left-3 flex items-center gap-2">
            <span className="font-mono text-[10px] text-slate-500 font-bold">POOLED SESSIONS</span>
            <span className="font-mono text-[10px] text-emerald-800 bg-emerald-50/90 border border-emerald-300 px-2 py-0.5 rounded-full font-bold">
              49.8M KEYS VERIFIED
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-slate-600 font-mono text-[11px] font-medium">
          <span>Neon Vector Sync: Active</span>
          <span>Prisma Schema Drift: 0.00%</span>
        </div>
      </motion.section>

      {/* Beginner-Friendly "In Plain English" Explanatory Callout & First-Time Deployer Assistant */}
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

      {/* DEPLOYMENT REGISTER SECTION */}
      <section className="flex flex-col gap-2.5 relative z-10" id="deployments">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[19px] text-primary">rocket_launch</span>
              <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">Deployment Register</h2>
            </div>
            <Link
              href="/deployments"
              className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5"
            >
              <span>View All ({mockDeployments.length})</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            </Link>
          </div>
          <p className="text-[12px] text-slate-600">Active and recent release runs across environments</p>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 p-1 rounded-full liquid-glass-pill text-[11px] font-mono">
            {["ALL", "PRODUCTION", "STAGING"].map((env) => (
              <button
                key={env}
                onClick={() => setFilterEnvironment(env)}
                className={`px-3 py-1 rounded-full transition-all font-semibold ${
                  filterEnvironment === env
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {env === "ALL" ? "All Environments" : env.charAt(0) + env.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400 liquid-glass-pill px-3 py-1 rounded-full shadow-xs">
            AUTO-SYNC: ON
          </span>
        </div>

        {/* Deployments List Rows */}
        <div className="flex flex-col gap-2.5 mt-1">
          {filteredDeployments.map((dep) => {
            const isCritical = dep.riskClassification === "CRITICAL" || dep.riskScore >= 80;
            const isWarning = dep.riskClassification === "HIGH_RISK" || (dep.riskScore >= 50 && dep.riskScore < 80);

            const scoreClass = isCritical
              ? "bg-red-100/90 text-red-700 border border-red-300"
              : isWarning
              ? "bg-amber-100/90 text-amber-800 border border-amber-300"
              : "bg-emerald-100/90 text-emerald-800 border border-emerald-300";

            const statusClass =
              dep.status === "blocked"
                ? "bg-red-50/90 border border-red-300 text-red-700 font-bold"
                : dep.status === "at_risk"
                ? "bg-amber-50/90 border border-amber-300 text-amber-800 font-bold"
                : dep.status === "rolled_back"
                ? "bg-rose-50/90 border border-rose-300 text-rose-700 font-bold"
                : "bg-emerald-50/90 border border-emerald-300 text-emerald-700 font-bold";

            return (
              <motion.div
                key={dep.id}
                variants={fadeInVariants}
                className={`p-3.5 rounded-2xl liquid-glass-card ${
                  isCritical ? "border-red-300/80" : ""
                } flex flex-col gap-2`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-[13px] text-slate-900 truncate">
                      {dep.service}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500 font-medium">
                      {dep.version || "v1.0.0"} • {dep.commitHash?.slice(0, 7) || "8a1e94b"}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                    <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold ${scoreClass}`}>
                      {dep.riskClassification} {dep.riskScore}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400 font-medium">
                      {new Date(dep.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-white/10 text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full liquid-glass-pill font-mono text-[10px] text-slate-700 font-semibold">
                      {dep.environment}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] uppercase ${statusClass}`}>
                      {dep.status.replace("_", " ")}
                    </span>
                  </div>
                  <Link
                    href={`/deployments/${dep.id}`}
                    className={`flex items-center gap-1 font-mono text-[11px] font-bold px-3 py-1 rounded-full liquid-glass-pill shadow-xs transition-all active:scale-95 ${
                      isCritical ? "text-red-600 hover:text-red-700 hover:border-red-300" : "text-slate-700 hover:text-slate-900"
                    }`}
                  >
                    <span>Inspect</span>
                    <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* RECURRING FAILURE CATEGORIES SECTION (Liquid Glass) */}
      <section className="flex flex-col gap-2.5 relative z-10">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[19px] text-rose-600">warning</span>
              <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">Recurring Failure Categories</h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full liquid-glass-pill text-slate-700 font-mono text-[10px] font-bold">
              Hindsight Index
            </span>
          </div>
          <p className="text-[12px] text-slate-600">Pattern trends indexed in Hindsight memory</p>
        </div>

        {/* Categories Stack */}
        <div className="flex flex-col gap-2.5 mt-1">
          {mockRecurringFailureCategories.map((cat) => (
            <div
              key={cat.id}
              className="p-4 rounded-2xl liquid-glass-card flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-[13px] text-slate-900">{cat.category}</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase flex-shrink-0 ${
                    cat.blastRadius === "HIGH"
                      ? "bg-rose-100/90 border border-rose-300 text-rose-700"
                      : "bg-amber-100/90 border border-amber-300 text-amber-800"
                  }`}
                >
                  {cat.blastRadius} Impact
                </span>
              </div>
              <p className="text-[12px] text-slate-600 leading-snug">{cat.description}</p>
              <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-white/10 font-mono text-[11px] text-slate-500">
                <span>{cat.incidentCount} incidents recorded</span>
                <span>MTTR: {cat.averageRecoveryMinutes}m</span>
                <span
                  className={`flex items-center gap-1 font-bold ${
                    cat.trend === "DECREASING" ? "text-emerald-700" : "text-slate-600"
                  }`}
                >
                  <span className="material-symbols-outlined text-[13px]">
                    {cat.trend === "DECREASING" ? "trending_down" : "remove"}
                  </span>
                  <span>{cat.trend}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HINDSIGHT MEMORY BANK CALLOUT FOOTER CARD (Liquid Glass) */}
      <section className="p-5 rounded-2xl liquid-glass-card relative overflow-hidden flex flex-col gap-3.5 mb-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl liquid-glass-pill flex items-center justify-center text-primary flex-shrink-0">
            <span className="material-symbols-outlined text-[22px]">psychology</span>
          </div>
          <div className="flex flex-col">
            <h3 className="text-[15px] font-bold text-slate-900">Hindsight Memory Bank</h3>
            <p className="text-[12px] text-slate-600 mt-0.5 leading-snug">
              Continuous retrospective memory learns from every post-mortem and protects upcoming releases.
            </p>
          </div>
        </div>
        <Link
          href="/memories"
          className="flex items-center justify-between px-4 py-3 rounded-xl liquid-glass-pill text-primary font-semibold"
        >
          <span className="text-[12px] font-bold text-slate-900">Explore Memory Bank (5 Indexed)</span>
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </Link>
      </section>
    </motion.div>
  );
}
