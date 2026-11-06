"use client";

import React, { useState } from "react";
import {
  Layers,
  BrainCircuit,
  GitBranch,
  Server,
  Activity,
  Bell,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Shield,
  KeyRound,
  Zap,
} from "lucide-react";
import { mockIntegrations } from "@/data/mockData";
import { IntegrationConfig } from "@/types";

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>(mockIntegrations);
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationConfig | null>(null);
  const [isTesting, setIsTesting] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const testConnection = (id: string) => {
    setIsTesting(id);
    setTimeout(() => {
      setIsTesting(null);
      setIntegrations((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: "CONNECTED",
                lastHeartbeat: "Just now (34ms)",
                latencyMs: 34,
              }
            : item
        )
      );
      showToast("Health probe passed: 200 OK across cluster endpoints.");
    }, 800);
  };

  const getProviderIcon = (provider: IntegrationConfig["provider"]) => {
    switch (provider) {
      case "hindsight":
        return BrainCircuit;
      case "github":
      case "gitlab":
        return GitBranch;
      case "argocd":
      case "kubernetes":
        return Server;
      case "datadog":
        return Activity;
      case "pagerduty":
        return Bell;
      case "slack":
        return MessageSquare;
      default:
        return Layers;
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto w-full font-sans">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-surface border border-brand-hindsight/60 text-zinc-100 px-4 py-3 rounded-lg shadow-technical-md font-mono text-xs flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-surface-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
            <span>Engineering Integrations & Gateways</span>
            <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800">
              7 CONNECTED
            </span>
          </h1>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">
            CI/CD runners, Kubernetes clusters, telemetry pipelines, and Vectorize Hindsight API configurations
          </p>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs">
          <button
            onClick={() => {
              integrations.forEach((i) => testConnection(i.id));
            }}
            className="px-3 py-1.5 rounded bg-surface-subtle hover:bg-surface-border text-zinc-300 border border-surface-border flex items-center space-x-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
            <span>Probe All Heartbeats</span>
          </button>
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((item) => {
          const Icon = getProviderIcon(item.provider);
          const isHindsight = item.provider === "hindsight";
          const testingThis = isTesting === item.id;

          return (
            <div
              key={item.id}
              className={`bg-surface border rounded-lg p-4 space-y-3 flex flex-col justify-between transition-colors shadow-technical-sm ${
                isHindsight
                  ? "border-brand-hindsight/50 bg-surface-subtle/30"
                  : "border-surface-border hover:border-zinc-700"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div
                      className={`w-8 h-8 rounded flex items-center justify-center ${
                        isHindsight
                          ? "bg-purple-950 text-purple-300 border border-purple-800"
                          : "bg-surface-subtle text-zinc-300 border border-surface-border"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-zinc-100">
                        {item.name}
                      </h3>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                      item.status === "CONNECTED"
                        ? "bg-emerald-950/60 text-emerald-400 border-emerald-800"
                        : "bg-amber-950/60 text-amber-400 border-amber-800"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{item.status}</span>
                  </span>
                </div>

                <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                  {item.description}
                </p>

                <div className="space-y-1 font-mono text-[11px] text-zinc-400 bg-surface-subtle p-2.5 rounded border border-surface-border/50">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Endpoint:</span>
                    <span className="truncate max-w-[180px] text-zinc-300" title={item.endpoint}>
                      {item.endpoint}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Latency:</span>
                    <span className="text-emerald-400">{item.latencyMs}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Events Synced:</span>
                    <span>{item.syncedEventsCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Heartbeat:</span>
                    <span className="text-zinc-400">{item.lastHeartbeat}</span>
                  </div>
                </div>

                {/* Capabilities list */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase text-zinc-500 block">
                    Active Capabilities:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {item.enabledCapabilities.map((cap, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-surface-subtle text-zinc-400 border border-surface-border/60"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-surface-border/60 flex items-center justify-between font-mono text-xs">
                <button
                  onClick={() => testConnection(item.id)}
                  disabled={testingThis}
                  className="px-2.5 py-1 rounded bg-surface-subtle hover:bg-surface-border text-zinc-300 text-[11px] border border-surface-border flex items-center space-x-1"
                >
                  <Zap className={`w-3 h-3 ${testingThis ? "animate-spin text-amber-400" : "text-zinc-400"}`} />
                  <span>{testingThis ? "PROBING..." : "TEST PING"}</span>
                </button>

                <button
                  onClick={() => setSelectedIntegration(item)}
                  className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] border border-zinc-700"
                >
                  CONFIGURE
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Configuration Modal */}
      {selectedIntegration && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-surface-border rounded-lg max-w-lg w-full p-5 space-y-4 shadow-technical-md">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="font-semibold text-sm text-zinc-100 flex items-center gap-2">
                <span>Configure {selectedIntegration.name}</span>
              </h3>
              <button
                onClick={() => setSelectedIntegration(null)}
                className="text-zinc-400 hover:text-white font-mono text-xs"
              >
                CLOSE
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Service Endpoint URL:</label>
                <input
                  type="text"
                  defaultValue={selectedIntegration.endpoint}
                  className="w-full bg-surface-subtle border border-surface-border p-2 rounded text-zinc-200 focus:outline-none focus:border-brand-hindsight"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">API Key / Auth Token (Masked):</label>
                <input
                  type="text"
                  defaultValue={selectedIntegration.credentialsMasked}
                  className="w-full bg-surface-subtle border border-surface-border p-2 rounded text-zinc-200 focus:outline-none focus:border-brand-hindsight"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Sync Interval (Seconds):</label>
                <input
                  type="number"
                  defaultValue={selectedIntegration.syncIntervalSec}
                  className="w-full bg-surface-subtle border border-surface-border p-2 rounded text-zinc-200 focus:outline-none focus:border-brand-hindsight"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-surface-border font-mono text-xs">
              <button
                onClick={() => setSelectedIntegration(null)}
                className="px-3 py-1.5 rounded text-zinc-400 hover:text-white border border-surface-border"
              >
                CANCEL
              </button>
              <button
                onClick={() => {
                  setSelectedIntegration(null);
                  showToast(`Configuration saved for ${selectedIntegration.name}.`);
                }}
                className="px-4 py-1.5 rounded bg-brand-hindsight hover:bg-brand-hindsight-dark text-white font-semibold"
              >
                SAVE CHANGES
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
