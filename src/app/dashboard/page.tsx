"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { mockDeployments, mockRecurringFailureCategories } from "@/data/mockData";
import { fadeInVariants, staggerContainer } from "@/lib/motion";

export default function DashboardPage() {
  const [filterEnvironment, setFilterEnvironment] = useState<string>("ALL");

  const totalMonitoredDeployments = mockDeployments.length;
  const criticalBlockedCount = mockDeployments.filter(
    (d) => d.status === "blocked" || d.riskClassification === "CRITICAL"
  ).length;

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
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-mono text-[10px] uppercase tracking-wider font-semibold text-slate-500">
              Telemetry Engine
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">
              Engine Active
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <h1 className="text-[24px] lg:text-[26px] font-bold text-slate-900 tracking-tight leading-tight">
            Release Operations Overview
          </h1>
          <p className="text-[13px] text-slate-600 leading-snug">
            Deterministic pre-flight risk classification, Prisma migration analysis, and Hindsight incident recall.
          </p>
        </div>

        {/* Quick Action Pill Group */}
        <div className="flex items-center gap-2 mt-1 overflow-x-auto no-scrollbar pb-0.5">
          <Link
            href="/learning-lab"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container-lowest border border-slate-200 shadow-sm text-primary hover:bg-slate-50 active:scale-95 transition-all flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">auto_awesome</span>
            <span className="text-[12px] font-semibold text-slate-900">Interactive Learning Lab</span>
          </Link>
          <Link
            href="/deployments"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container-low border border-slate-200/80 hover:bg-surface-container text-slate-600 hover:text-slate-900 active:scale-95 transition-all flex-shrink-0"
          >
            <span className="text-[12px] font-medium">Deployment Register</span>
            <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
          </Link>
        </div>
      </section>

      {/* 2x2 Telemetry Stat Cards Grid */}
      <section aria-label="Core Metrics" className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Stat 1: Active Runs */}
        <motion.div
          variants={fadeInVariants}
          className="flex flex-col justify-between p-3.5 rounded-lg bg-surface-container-lowest border border-slate-200/90 shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider">Active Runs</span>
            <span className="material-symbols-outlined text-[17px] text-primary">hub</span>
          </div>
          <div className="my-1.5 flex items-baseline gap-1.5">
            <span className="text-[28px] font-bold text-slate-900 tracking-tight">{totalMonitoredDeployments}</span>
            <span className="font-mono text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
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
          className="flex flex-col justify-between p-3.5 rounded-lg bg-surface-container-lowest border border-red-200/90 shadow-sm relative overflow-hidden bg-gradient-to-br from-white to-red-50/30"
        >
          <div className="flex items-center justify-between text-rose-700">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider">Interceptions</span>
            <span className="material-symbols-outlined text-[17px] text-rose-600">gpp_bad</span>
          </div>
          <div className="my-1.5 flex items-baseline gap-1.5">
            <span className="text-[28px] font-bold text-rose-600 tracking-tight">{criticalBlockedCount}</span>
            <span className="font-mono text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded uppercase">
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
          className="flex flex-col justify-between p-3.5 rounded-lg bg-surface-container-lowest border border-slate-200/90 shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider">Retained Memories</span>
            <span className="material-symbols-outlined text-[17px] text-primary">psychology</span>
          </div>
          <div className="my-1.5 flex items-baseline gap-1.5">
            <span className="text-[28px] font-bold text-slate-900 tracking-tight">5</span>
            <span className="font-mono text-[11px] font-semibold text-primary bg-primary/10 px-1.5 py-0.2 rounded border border-primary/20">
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
          className="flex flex-col justify-between p-3.5 rounded-lg bg-surface-container-lowest border border-slate-200/90 shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider">Rule Enforcement</span>
            <span className="material-symbols-outlined text-[17px] text-emerald-600">shield</span>
          </div>
          <div className="my-1.5 flex items-baseline gap-1.5">
            <span className="text-[28px] font-bold text-slate-900 tracking-tight">8</span>
            <span className="font-mono text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded uppercase border border-slate-200">
              Rules
            </span>
          </div>
          <p className="font-mono text-[10px] text-slate-500 leading-tight truncate">
            Deterministic pre-flight checks
          </p>
        </motion.div>
      </section>

      {/* CRITICAL INTERCEPTION CARD HERO CALLOUT */}
      <motion.section
        variants={fadeInVariants}
        className="flex flex-col rounded-lg bg-red-50/70 border border-red-200 p-4 shadow-sm relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-red-600"></div>
        {/* Top banner strip */}
        <div className="flex items-start justify-between gap-2 mb-2 pt-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
            </span>
            <span className="font-mono text-[11px] font-bold text-red-700 tracking-wider uppercase truncate">
              Critical Pre-flight Interception
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-white/90 border border-red-200 font-mono text-[11px] font-semibold text-slate-700 flex-shrink-0">
            auth-gateway
          </span>
        </div>

        {/* Incident Title */}
        <h2 className="text-[15px] font-semibold text-slate-900 leading-snug tracking-tight mb-3">
          feat(auth): add passkey biometric verification and session metadata table migration
        </h2>

        {/* Score metric + CTA Bar */}
        <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-white border border-red-200/80 mb-3 shadow-sm">
          <div className="flex flex-col">
            <span className="font-mono text-[10px] uppercase font-semibold text-slate-500">Risk Score</span>
            <div className="flex items-baseline gap-1">
              <span className="text-[20px] font-bold text-red-600">92</span>
              <span className="font-mono text-[11px] text-slate-500">/ 100</span>
            </div>
          </div>
          <Link
            href="/deployments/dep-prod-9402"
            className="flex items-center justify-center gap-1.5 px-3.5 h-9 rounded-lg bg-red-600 hover:bg-red-700 active:scale-95 text-white font-medium text-[12px] transition-all shadow-sm"
          >
            <span>Inspect Assessment</span>
            <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
          </Link>
        </div>

        {/* Nested Diagnostics Accordion Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {/* Evidence 1 */}
          <div className="p-3 rounded-lg bg-white border border-red-100 flex flex-col gap-1 shadow-sm">
            <div className="flex items-center gap-1.5 text-primary">
              <span className="material-symbols-outlined text-[15px]">database</span>
              <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">Detected Evidence</span>
            </div>
            <p className="text-[13px] font-medium text-slate-800 leading-snug">
              Table rewrite lock detected on table with 49.8M rows
            </p>
            <p className="text-[11px] text-red-600 font-medium leading-snug mt-auto">
              Impact: Estimated 5.2 minutes total downtime for all authentication routes.
            </p>
          </div>

          {/* Evidence 2 (Hindsight Incident) */}
          <div className="p-3 rounded-lg bg-white border border-slate-200/80 flex flex-col gap-1 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-primary">
                <span className="material-symbols-outlined text-[15px]">history</span>
                <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">Recalled Hindsight Incident</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono text-[10px] font-bold border border-primary/20">
                94.0% MATCH
              </span>
            </div>
            <p className="text-[13px] font-medium text-slate-800 leading-snug">
              Postgres Table Rewrite Outage during User Schema Migration
            </p>
            <span className="font-mono text-[10px] text-slate-500 mt-auto">
              Referenced root cause: INC-8842
            </span>
          </div>

          {/* Evidence 3 (Verification Gate) */}
          <div className="p-3 rounded-lg bg-white border border-amber-200 flex flex-col gap-1 shadow-sm">
            <div className="flex items-center gap-1.5 text-amber-700">
              <span className="material-symbols-outlined text-[15px]">lock</span>
              <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">Verification Gate</span>
            </div>
            <p className="text-[12px] text-slate-700 leading-snug">
              Requires refactoring migration to non-blocking pattern + manual verification sign-off.
            </p>
            <div className="flex items-center gap-1 font-mono text-[11px] text-red-700 font-semibold mt-auto">
              <span className="material-symbols-outlined text-[13px]">pause_circle</span>
              <span>Deployment paused in CI</span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Visual Storytelling: Pre-flight Pressure Matrix */}
      <motion.section
        variants={fadeInVariants}
        className="flex flex-col p-4 rounded-lg bg-surface-container-lowest border border-slate-200 gap-3 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-primary">tune</span>
            <span className="text-[14px] font-semibold text-slate-900">Pre-flight Pressure Matrix</span>
          </div>
          <span className="font-mono text-[10px] text-slate-500 uppercase font-medium">
            Correlated Shards
          </span>
        </div>

        {/* Sparkline / telemetry visual */}
        <div className="w-full h-18 relative flex items-end justify-between px-3 pt-3 bg-slate-50 border border-slate-100 rounded-lg overflow-hidden">
          <svg className="w-full h-14 text-primary" fill="none" preserveAspectRatio="none" viewBox="0 0 100 30">
            <path
              d="M0 24 Q 15 20, 25 22 T 50 14 T 70 26 T 85 4 T 100 28"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2"
            />
            <path
              d="M0 24 Q 15 20, 25 22 T 50 14 T 70 26 T 85 4 T 100 28 L 100 30 L 0 30 Z"
              fill="rgba(66, 97, 100, 0.12)"
            />
          </svg>
          <div className="absolute top-2 left-3 flex items-center gap-2">
            <span className="font-mono text-[10px] text-slate-500 font-medium">POOLED SESSIONS</span>
            <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold border border-emerald-200">
              49.8M KEYS VERIFIED
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-slate-500 font-mono text-[11px]">
          <span>Neon Vector Sync: Active</span>
          <span>Prisma Schema Drift: 0.00%</span>
        </div>
      </motion.section>

      {/* DEPLOYMENT REGISTER SECTION */}
      <section className="flex flex-col gap-2 relative z-10" id="deployments">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-primary">terminal</span>
              <h2 className="text-[17px] font-bold text-slate-900 tracking-tight">Deployment Register</h2>
            </div>
            <span className="font-mono text-[11px] text-slate-500 font-medium">
              {filteredDeployments.length} Total
            </span>
          </div>
          <p className="text-[12px] text-slate-600">Correlated pipeline runs across environments</p>
        </div>

        {/* Filter Controls Segment */}
        <div className="flex items-center justify-between gap-2 mt-1">
          <div className="flex items-center p-0.5 rounded-lg bg-surface-container-low border border-slate-200">
            {["ALL", "PRODUCTION", "STAGING"].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterEnvironment(tab)}
                className={`px-3 py-1 rounded-md font-mono text-[10px] uppercase tracking-wider transition-all ${
                  filterEnvironment === tab
                    ? "bg-white text-slate-900 font-semibold shadow-sm"
                    : "text-slate-600 hover:text-slate-900 font-medium"
                }`}
              >
                {tab === "ALL" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          <span className="font-mono text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
            AUTO-SYNC: ON
          </span>
        </div>

        {/* Deployments List Rows */}
        <div className="flex flex-col gap-2 mt-1">
          {filteredDeployments.map((dep) => {
            const isCritical = dep.riskClassification === "CRITICAL" || dep.riskScore >= 80;
            const isWarning = dep.riskClassification === "HIGH_RISK" || (dep.riskScore >= 50 && dep.riskScore < 80);

            const scoreClass = isCritical
              ? "bg-red-100/80 text-red-700 border border-red-200"
              : isWarning
              ? "bg-amber-50 text-amber-800 border border-amber-200"
              : "bg-emerald-50 text-emerald-700 border border-emerald-200";

            const statusClass =
              dep.status === "blocked"
                ? "bg-red-50 border border-red-200 text-red-700"
                : dep.status === "at_risk"
                ? "bg-amber-50 text-amber-800"
                : dep.status === "rolled_back"
                ? "bg-rose-50 text-rose-700 border border-rose-200"
                : "bg-emerald-50 text-emerald-700";

            return (
              <motion.div
                key={dep.id}
                variants={fadeInVariants}
                className={`p-3 rounded-lg bg-surface-container-lowest border ${
                  isCritical ? "border-red-200 hover:border-red-300" : "border-slate-200 hover:border-slate-300"
                } transition-all flex flex-col gap-2 shadow-sm`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-[13px] text-slate-900 truncate">
                      {dep.service}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">
                      {dep.version || "v1.0.0"} • {dep.commitHash?.slice(0, 7) || "8a1e94b"}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${scoreClass}`}>
                      {dep.riskClassification} {dep.riskScore}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {new Date(dep.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[10px] text-slate-700 border border-slate-200">
                      {dep.environment}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold uppercase ${statusClass}`}>
                      {dep.status.replace("_", " ")}
                    </span>
                  </div>
                  <Link
                    href={`/deployments/${dep.id}`}
                    className={`flex items-center gap-0.5 font-mono text-[11px] font-semibold py-1 ${
                      isCritical ? "text-red-600 hover:text-red-700" : "text-primary hover:text-slate-900"
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

      {/* RECURRING FAILURE CATEGORIES SECTION */}
      <section className="flex flex-col gap-2 relative z-10">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-rose-600">warning</span>
              <h2 className="text-[17px] font-bold text-slate-900 tracking-tight">Recurring Failure Categories</h2>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[10px] font-semibold border border-slate-200">
              Hindsight Index
            </span>
          </div>
          <p className="text-[12px] text-slate-600">Pattern trends indexed in Hindsight memory</p>
        </div>

        {/* Categories Stack */}
        <div className="flex flex-col gap-2 mt-1">
          {mockRecurringFailureCategories.map((cat) => (
            <div
              key={cat.id}
              className="p-3 rounded-lg bg-surface-container-lowest border border-slate-200 flex flex-col gap-1.5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-[13px] text-slate-900">{cat.category}</span>
                <span
                  className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase flex-shrink-0 ${
                    cat.blastRadius === "HIGH"
                      ? "bg-rose-50 border border-rose-200 text-rose-700"
                      : "bg-amber-50 border border-amber-200 text-amber-800"
                  }`}
                >
                  {cat.blastRadius} Impact
                </span>
              </div>
              <p className="text-[12px] text-slate-600 leading-snug">{cat.description}</p>
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 font-mono text-[11px] text-slate-500">
                <span>{cat.incidentCount} incidents recorded</span>
                <span>MTTR: {cat.averageRecoveryMinutes}m</span>
                <span
                  className={`flex items-center gap-0.5 font-semibold ${
                    cat.trend === "DECREASING" ? "text-emerald-700" : "text-slate-500"
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

      {/* HINDSIGHT MEMORY BANK CALLOUT FOOTER CARD */}
      <section className="p-4 rounded-lg bg-surface-container-lowest border border-slate-200 relative overflow-hidden shadow-sm flex flex-col gap-3 mb-2">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            <span className="material-symbols-outlined text-[20px]">psychology</span>
          </div>
          <div className="flex flex-col">
            <h3 className="text-[14px] font-bold text-slate-900">Hindsight Memory Bank</h3>
            <p className="text-[12px] text-slate-600 mt-0.5 leading-snug">
              Continuous retrospective memory learns from every post-mortem and protects upcoming releases.
            </p>
          </div>
        </div>
        <Link
          href="/memories"
          className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-surface-container-low border border-slate-200 hover:bg-surface-container active:scale-[0.99] transition-all text-primary font-medium"
        >
          <span className="text-[12px] font-semibold text-slate-900">Explore Memory Bank (5 Indexed)</span>
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </Link>
      </section>
    </motion.div>
  );
}
