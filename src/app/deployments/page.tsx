"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Search,
  ArrowUpDown,
  ChevronRight,
  BrainCircuit,
  RotateCcw,
  Database,
} from "lucide-react";
import { mockDeployments } from "@/data/mockData";
import { RiskBadge, StatusBadge } from "@/components/ui/StatusBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  staggerContainer,
  hoverSubtle,
  tapSubtle,
} from "@/lib/motion";

export default function DeploymentsHistoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedEnv, setSelectedEnv] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"timestamp" | "riskScore" | "service">("timestamp");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Filtered and sorted deployments
  const filtered = useMemo(() => {
    return mockDeployments
      .filter((dep) => {
        const matchesSearch =
          dep.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dep.commitHash.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dep.commitMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dep.author.name.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus =
          selectedStatus === "ALL" || dep.status.toLowerCase() === selectedStatus.toLowerCase();

        const matchesEnv =
          selectedEnv === "ALL" || dep.environment.toLowerCase() === selectedEnv.toLowerCase();

        return matchesSearch && matchesStatus && matchesEnv;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortBy === "timestamp") {
          comparison = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        } else if (sortBy === "riskScore") {
          comparison = b.riskScore - a.riskScore;
        } else if (sortBy === "service") {
          comparison = a.service.localeCompare(b.service);
        }
        return sortOrder === "desc" ? comparison : -comparison;
      });
  }, [searchQuery, selectedStatus, selectedEnv, sortBy, sortOrder]);

  const toggleSort = (field: "timestamp" | "riskScore" | "service") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedStatus("ALL");
    setSelectedEnv("ALL");
    setSortBy("timestamp");
    setSortOrder("desc");
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto w-full"
    >
      {/* Page Header */}
      <PageHeader
        title="Deployment Register"
        subtitle="Audited repository releases, Prisma schema migrations, and correlated Hindsight intelligence."
        badge={
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-elevated text-signal border border-surface-border">
            {filtered.length} RUNS
          </span>
        }
        actions={
          <motion.button
            whileHover={hoverSubtle}
            whileTap={tapSubtle}
            onClick={resetFilters}
            className="px-3.5 py-1.5 rounded-full liquid-glass-pill text-text-secondary hover:text-text-primary text-xs font-mono flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </motion.button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="liquid-glass-card rounded-2xl p-4 grid grid-cols-1 md:grid-cols-4 gap-3 font-mono text-xs shadow-sm">
        {/* Search */}
        <div className="md:col-span-2 relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search service, commit SHA, message, author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-elevated border border-surface-border rounded pl-8 pr-3 py-2 text-text-primary placeholder-text-muted focus:outline-none focus:border-signal/60 font-mono text-xs"
          />
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-surface-elevated border border-surface-border rounded px-3 py-2 text-text-secondary focus:outline-none focus:border-signal/60 font-mono text-xs"
          >
            <option value="ALL">Status: All Statuses</option>
            <option value="passed">Passed</option>
            <option value="at_risk">At Risk</option>
            <option value="blocked">Blocked</option>
            <option value="rolled_back">Rolled Back</option>
          </select>
        </div>

        {/* Environment Filter */}
        <div>
          <select
            value={selectedEnv}
            onChange={(e) => setSelectedEnv(e.target.value)}
            className="w-full bg-surface-elevated border border-surface-border rounded px-3 py-2 text-text-secondary focus:outline-none focus:border-signal/60 font-mono text-xs"
          >
            <option value="ALL">Environment: All Environments</option>
            <option value="production">Production</option>
            <option value="staging">Staging</option>
          </select>
        </div>
      </div>

      {/* Deployments Table / List */}
      <div className="liquid-glass-card rounded-2xl overflow-hidden font-sans shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-elevated/80 border-b border-surface-border font-mono text-[10px] text-text-muted uppercase tracking-wider">
              <tr>
                <th
                  onClick={() => toggleSort("service")}
                  className="py-3 px-4 cursor-pointer hover:text-text-primary select-none"
                >
                  <div className="flex items-center space-x-1">
                    <span>Service & Commit SHA</span>
                    <ArrowUpDown className="w-3 h-3 text-text-muted" />
                  </div>
                </th>
                <th className="py-3 px-4">Target Environment</th>
                <th
                  onClick={() => toggleSort("riskScore")}
                  className="py-3 px-4 cursor-pointer hover:text-text-primary select-none"
                >
                  <div className="flex items-center space-x-1">
                    <span>Risk Index</span>
                    <ArrowUpDown className="w-3 h-3 text-text-muted" />
                  </div>
                </th>
                <th className="py-3 px-4">Hindsight Recall</th>
                <th className="py-3 px-4">Pipeline Status</th>
                <th
                  onClick={() => toggleSort("timestamp")}
                  className="py-3 px-4 cursor-pointer hover:text-text-primary select-none"
                >
                  <div className="flex items-center space-x-1">
                    <span>Timestamp</span>
                    <ArrowUpDown className="w-3 h-3 text-text-muted" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-surface-border font-mono text-text-secondary">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <EmptyState
                      title="No deployment runs match filters"
                      description="Try clearing search query or adjusting status and environment filters."
                      action={{
                        label: "Reset Filters",
                        onClick: resetFilters,
                      }}
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((dep) => {
                  const hasMemory = dep.recalledMemories.length > 0;
                  const highestMemory = dep.recalledMemories[0];

                  return (
                    <motion.tr
                      key={dep.id}
                      layout
                      className="hover:bg-surface-elevated/40 transition-colors group"
                    >
                      {/* Service & Commit */}
                      <td className="py-3 px-4 font-sans">
                        <div className="flex flex-col space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <Link
                              href={`/deployments/${dep.id}`}
                              className="font-semibold text-text-primary hover:text-signal transition-colors text-xs"
                            >
                              {dep.service}
                            </Link>
                            <span className="font-mono text-[10px] text-text-muted">
                              {dep.version}
                            </span>
                          </div>
                          <span className="text-[11px] text-text-muted font-mono flex items-center space-x-1 truncate max-w-xs">
                            <span className="text-signal/80">{dep.commitHash.substring(0, 8)}</span>
                            <span>•</span>
                            <span className="truncate">{dep.commitMessage}</span>
                          </span>
                        </div>
                      </td>

                      {/* Environment & Vercel/Neon Target */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col text-[11px]">
                          <span className="text-text-primary uppercase font-semibold font-mono">
                            {dep.environment}
                          </span>
                          <span className="text-text-muted text-[10px] truncate max-w-[150px] font-mono flex items-center gap-1">
                            <Database className="w-2.5 h-2.5 text-signal" />
                            <span>Vercel / Neon</span>
                          </span>
                        </div>
                      </td>

                      {/* Risk Index */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <RiskBadge classification={dep.riskClassification} size="sm" />
                          <span
                            className={`font-mono text-xs font-bold ${
                              dep.riskScore >= 80
                                ? "text-risk-critical"
                                : dep.riskScore >= 60
                                ? "text-risk-warning"
                                : "text-sage"
                            }`}
                          >
                            {dep.riskScore}
                          </span>
                        </div>
                      </td>

                      {/* Hindsight Memory Recalled */}
                      <td className="py-3 px-4">
                        {hasMemory ? (
                          <div className="inline-flex items-center gap-1.5 text-signal bg-signal/10 border border-signal/30 px-2 py-0.5 rounded text-[11px] font-mono">
                            <BrainCircuit className="w-3.5 h-3.5 text-signal shrink-0" />
                            <span className="font-semibold truncate max-w-[120px]">
                              {highestMemory.id}
                            </span>
                            <span className="text-signal/80 text-[10px]">
                              ({((highestMemory.similarityScore || 0) * 100).toFixed(0)}%)
                            </span>
                          </div>
                        ) : (
                          <span className="text-text-muted text-[11px]">— No prior match</span>
                        )}
                      </td>

                      {/* Pipeline Status */}
                      <td className="py-3 px-4">
                        <StatusBadge status={dep.status} />
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-4 text-[11px] text-text-secondary">
                        <div>{new Date(dep.timestamp).toLocaleDateString()}</div>
                        <div className="text-text-muted text-[10px]">
                          {new Date(dep.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <Link href={`/deployments/${dep.id}`}>
                          <motion.div
                            whileHover={hoverSubtle}
                            whileTap={tapSubtle}
                            className="px-3 py-1 rounded-full liquid-glass-pill text-text-secondary hover:text-text-primary text-xs font-mono inline-flex items-center space-x-1 transition-all shadow-xs active:scale-95"
                          >
                            <span>Inspect</span>
                            <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
                          </motion.div>
                        </Link>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

