"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Layers,
  BrainCircuit,
  GitBranch,
  Server,
  Activity,
  Bell,
  MessageSquare,
  RotateCcw,
  Zap,
  X,
} from "lucide-react";
import { mockIntegrations } from "@/data/mockData";
import { IntegrationConfig } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/ToastProvider";
import {
  fadeInVariants,
  staggerContainer,
  modalVariants,
  backdropVariants,
  hoverSubtle,
  tapSubtle,
} from "@/lib/motion";

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>(mockIntegrations);
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationConfig | null>(null);
  const [isTesting, setIsTesting] = useState<string | null>(null);
  const { success, info } = useToast();

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
                lastHeartbeat: "Just now (verified)",
                latencyMs: item.latencyMs > 0 ? item.latencyMs : 24,
              }
            : item
        )
      );
      success("Health Probe Passed", "200 OK across verified integration endpoint.");
    }, 600);
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
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto w-full font-sans"
    >
      {/* Header */}
      <PageHeader
        title="Engineering Integrations"
        subtitle="Vercel deployments, Neon PostgreSQL, GitHub Actions, Vectorize Hindsight Cloud, and Inngest durable workflows."
        badge={
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-elevated text-signal border border-surface-border">
            {integrations.length} CONFIGURED
          </span>
        }
        actions={
          <motion.button
            whileHover={hoverSubtle}
            whileTap={tapSubtle}
            onClick={() => {
              integrations.forEach((i) => testConnection(i.id));
              info("Probing All Integrations", "Dispatched ping requests to all connected endpoints.");
            }}
            className="px-4 py-2 rounded-full liquid-glass-pill text-text-secondary hover:text-text-primary font-mono text-xs flex items-center space-x-1.5 transition-all shadow-sm active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5 text-text-muted" />
            <span>Probe All Heartbeats</span>
          </motion.button>
        }
      />

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((item) => {
          const Icon = getProviderIcon(item.provider);
          const isHindsight = item.provider === "hindsight";
          const testingThis = isTesting === item.id;

          return (
            <motion.div
              key={item.id}
              variants={fadeInVariants}
              className={`liquid-glass-card rounded-2xl p-5 space-y-3 flex flex-col justify-between transition-all shadow-sm hover:shadow-md ${
                isHindsight
                  ? "border-sky-300 ring-1 ring-sky-300/30"
                  : ""
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div
                      className={`w-8 h-8 rounded flex items-center justify-center ${
                        isHindsight
                          ? "bg-signal/15 text-signal border border-signal/30"
                          : "bg-surface-elevated text-text-primary border border-surface-border"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-text-primary">
                        {item.name}
                      </h3>
                      <span className="text-[10px] font-mono text-text-muted">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 bg-sage/15 text-sage border-sage/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-sage animate-pulse" />
                    <span>{item.status}</span>
                  </span>
                </div>

                <p className="text-[11px] text-text-secondary font-sans leading-relaxed">
                  {item.description}
                </p>

                <div className="space-y-1 font-mono text-[11px] text-text-secondary bg-surface-elevated p-2.5 rounded border border-surface-border">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Endpoint:</span>
                    <span className="truncate max-w-[180px] text-text-primary" title={item.endpoint}>
                      {item.endpoint}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Latency:</span>
                    <span className="text-sage">{item.latencyMs}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Events Synced:</span>
                    <span className="text-text-primary">{item.syncedEventsCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Heartbeat:</span>
                    <span className="text-text-secondary">{item.lastHeartbeat}</span>
                  </div>
                </div>

                {/* Capabilities list */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase text-text-muted block">
                    Active Capabilities:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {item.enabledCapabilities.map((cap, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-surface-elevated text-text-secondary border border-surface-border"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-surface-border flex items-center justify-between font-mono text-xs">
                <motion.button
                  whileHover={hoverSubtle}
                  whileTap={tapSubtle}
                  onClick={() => testConnection(item.id)}
                  disabled={testingThis}
                  className="px-3.5 py-1.5 rounded-full liquid-glass-pill text-text-primary text-[11px] flex items-center space-x-1 shadow-xs active:scale-95 font-semibold"
                >
                  <Zap className={`w-3 h-3 ${testingThis ? "animate-spin text-signal" : "text-text-muted"}`} />
                  <span>{testingThis ? "PROBING..." : "TEST PING"}</span>
                </motion.button>

                <motion.button
                  whileHover={hoverSubtle}
                  whileTap={tapSubtle}
                  onClick={() => setSelectedIntegration(item)}
                  className="px-2.5 py-1 rounded bg-surface-elevated hover:bg-surface-elevated/80 text-text-secondary hover:text-text-primary text-[11px] border border-surface-border"
                >
                  CONFIGURE
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Configuration Modal with Motion AnimatePresence */}
      <AnimatePresence>
        {selectedIntegration && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setSelectedIntegration(null)}
            />
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative z-10 bg-surface-elevated border border-surface-border rounded max-w-lg w-full p-5 space-y-4 shadow-panel-elevated"
            >
              <div className="flex items-center justify-between border-b border-surface-border pb-3">
                <h3 className="font-semibold text-sm text-text-primary flex items-center gap-2">
                  <span>Configure {selectedIntegration.name}</span>
                </h3>
                <button
                  onClick={() => setSelectedIntegration(null)}
                  className="text-text-muted hover:text-text-primary"
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div>
                  <label className="text-text-muted block mb-1">Service Endpoint URL:</label>
                  <input
                    type="text"
                    defaultValue={selectedIntegration.endpoint}
                    className="w-full bg-surface border border-surface-border p-2 rounded text-text-primary focus:outline-none focus:border-signal font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="text-text-muted block mb-1">API Key / Auth Token (Masked):</label>
                  <input
                    type="text"
                    defaultValue={selectedIntegration.credentialsMasked}
                    className="w-full bg-surface border border-surface-border p-2 rounded text-text-primary focus:outline-none focus:border-signal font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="text-text-muted block mb-1">Sync Interval (Seconds):</label>
                  <input
                    type="number"
                    defaultValue={selectedIntegration.syncIntervalSec}
                    className="w-full bg-surface border border-surface-border p-2 rounded text-text-primary focus:outline-none focus:border-signal font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-surface-border font-mono text-xs">
                <button
                  onClick={() => setSelectedIntegration(null)}
                  className="px-3 py-1.5 rounded text-text-muted hover:text-text-primary border border-surface-border"
                >
                  CANCEL
                </button>
                <motion.button
                  whileHover={hoverSubtle}
                  whileTap={tapSubtle}
                  onClick={() => {
                    const name = selectedIntegration.name;
                    setSelectedIntegration(null);
                    success("Configuration Saved", `Updated credentials and interval for ${name}.`);
                  }}
                  className="px-4 py-1.5 rounded bg-signal text-canvas font-semibold"
                >
                  SAVE CHANGES
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

