"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  GitCommit,
  Search,
  Filter,
  ArrowUpDown,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  BrainCircuit,
  RotateCcw,
  CheckCircle,
  Clock,
  Layers,
} from "lucide-react";
import { mockDeployments } from "@/data/mockData";
import { RiskBadge, StatusBadge } from "@/components/ui/StatusBadge";
import { DeploymentStatus, RiskClassification } from "@/types";

export default function DeploymentsHistoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedEnv, setSelectedEnv] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"timestamp" | "riskScore" | "service">("timestamp");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Filtered and sorted deployments
  const filtered = useMemo(() => {
    return mockDeployments.filter((dep) => {
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
    }).sort((a, b) => {
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
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-surface-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
            <span>Deployment History & Pipeline Runs</span>
            <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-surface-subtle text-zinc-400 border border-surface-border">
              {filtered.length} runs
            </span>
          </h1>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">
            Audit trail of release assessments, risk classification, and Hindsight recall outcomes
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={resetFilters}
            className="px-3 py-1.5 rounded bg-surface-subtle hover:bg-surface-border text-zinc-400 hover:text-zinc-200 border border-surface-border text-xs font-mono flex items-center space-x-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface border border-surface-border rounded-lg p-3.5 grid grid-cols-1 md:grid-cols-4 gap-3 font-mono text-xs">
        {/* Search */}
        <div className="md:col-span-2 relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search service, commit hash, author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-subtle border border-surface-border rounded pl-8 pr-3 py-2 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-brand-hindsight/50"
          />
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-surface-subtle border border-surface-border rounded px-3 py-2 text-zinc-300 focus:outline-none focus:border-brand-hindsight/50"
          >
            <option value="ALL">Status: All</option>
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
            className="w-full bg-surface-subtle border border-surface-border rounded px-3 py-2 text-zinc-300 focus:outline-none focus:border-brand-hindsight/50"
          >
            <option value="ALL">Environment: All</option>
            <option value="production">Production</option>
            <option value="staging">Staging</option>
          </select>
        </div>
      </div>

      {/* Deployments Table / List */}
      <div className="bg-surface border border-surface-border rounded-lg overflow-hidden font-sans">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-subtle border-b border-surface-border font-mono text-[11px] text-zinc-400 uppercase tracking-wider">
              <tr>
                <th
                  onClick={() => toggleSort("service")}
                  className="py-3 px-4 cursor-pointer hover:text-zinc-200 select-none"
                >
                  <div className="flex items-center space-x-1">
                    <span>Service & Commit</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                  </div>
                </th>
                <th className="py-3 px-4">Environment</th>
                <th
                  onClick={() => toggleSort("riskScore")}
                  className="py-3 px-4 cursor-pointer hover:text-zinc-200 select-none"
                >
                  <div className="flex items-center space-x-1">
                    <span>Risk Index</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                  </div>
                </th>
                <th className="py-3 px-4">Hindsight Memory Recalled</th>
                <th className="py-3 px-4">Pipeline Status</th>
                <th
                  onClick={() => toggleSort("timestamp")}
                  className="py-3 px-4 cursor-pointer hover:text-zinc-200 select-none"
                >
                  <div className="flex items-center space-x-1">
                    <span>Timestamp</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-surface-border font-mono text-zinc-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500 font-mono text-xs">
                    No deployment records matched your filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((dep) => {
                  const hasMemory = dep.recalledMemories.length > 0;
                  const highestMemory = dep.recalledMemories[0];

                  return (
                    <tr
                      key={dep.id}
                      className="hover:bg-surface-subtle/70 transition-colors group"
                    >
                      {/* Service & Commit */}
                      <td className="py-3.5 px-4 font-sans">
                        <div className="flex flex-col space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <Link
                              href={`/deployments/${dep.id}`}
                              className="font-semibold text-zinc-100 hover:text-brand-hindsight transition-colors text-xs"
                            >
                              {dep.service}
                            </Link>
                            <span className="font-mono text-[10px] text-zinc-500">
                              {dep.version}
                            </span>
                          </div>
                          <span className="text-[11px] text-zinc-400 font-mono flex items-center space-x-1 truncate max-w-xs">
                            <span className="text-zinc-500">{dep.commitHash}</span>
                            <span>•</span>
                            <span className="truncate">{dep.commitMessage}</span>
                          </span>
                        </div>
                      </td>

                      {/* Environment & Target Cluster */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col text-[11px]">
                          <span className="text-zinc-200 uppercase font-semibold">
                            {dep.environment}
                          </span>
                          <span className="text-zinc-500 text-[10px] truncate max-w-[140px]">
                            {dep.targetCluster}
                          </span>
                        </div>
                      </td>

                      {/* Risk Index */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <RiskBadge classification={dep.riskClassification} size="sm" />
                          <span
                            className={`font-mono text-xs font-bold ${
                              dep.riskScore >= 80
                                ? "text-red-400"
                                : dep.riskScore >= 60
                                ? "text-orange-400"
                                : "text-emerald-400"
                            }`}
                          >
                            {dep.riskScore}
                          </span>
                        </div>
                      </td>

                      {/* Hindsight Memory Recalled */}
                      <td className="py-3.5 px-4">
                        {hasMemory ? (
                          <div className="flex items-center space-x-1.5 text-purple-300 bg-purple-950/40 border border-purple-800/40 px-2 py-0.5 rounded text-[11px]">
                            <BrainCircuit className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            <span className="font-semibold truncate max-w-[120px]">
                              {highestMemory.id}
                            </span>
                            <span className="text-purple-400 font-mono text-[10px]">
                              ({((highestMemory.similarityScore || 0) * 100).toFixed(0)}%)
                            </span>
                          </div>
                        ) : (
                          <span className="text-zinc-600 text-[11px]">— No prior match</span>
                        )}
                      </td>

                      {/* Pipeline Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={dep.status} />
                      </td>

                      {/* Timestamp */}
                      <td className="py-3.5 px-4 text-[11px] text-zinc-400">
                        <div>{new Date(dep.timestamp).toLocaleDateString()}</div>
                        <div className="text-zinc-500 text-[10px]">
                          {new Date(dep.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/deployments/${dep.id}`}
                          className="px-2.5 py-1 rounded bg-surface-subtle hover:bg-surface-border text-zinc-300 text-xs font-mono border border-surface-border inline-flex items-center space-x-1 group-hover:border-zinc-600 transition-colors"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
