"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import {
  BrainCircuit,
  ShieldCheck,
  Bell,
  Save,
  Download,
} from "lucide-react";
import { mockDefaultSettings } from "@/data/mockData";
import { WorkspaceSettings } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/ToastProvider";
import {
  fadeInVariants,
  staggerContainer,
  hoverSubtle,
  tapSubtle,
} from "@/lib/motion";

export default function SettingsPage() {
  const [settings, setSettings] = useState<WorkspaceSettings>(mockDefaultSettings);
  const { success, info } = useToast();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    success("Settings Saved", "Workspace policy configuration updated and distributed to active CI runners.");
  };

  const handleExportAudit = () => {
    const dataStr =
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "releasetrace-settings-export.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    info("Config Exported", "Settings audit JSON archive downloaded.");
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="p-4 lg:p-6 space-y-6 max-w-5xl mx-auto w-full font-sans"
    >
      {/* Header */}
      <PageHeader
        title="Workspace & Policy Configuration"
        subtitle="Pre-flight deterministic gating thresholds, Hindsight retention windows, and notification webhooks."
        badge={
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-elevated text-signal border border-surface-border">
            ACTIVE POLICY
          </span>
        }
        actions={
          <motion.button
            whileHover={hoverSubtle}
            whileTap={tapSubtle}
            onClick={handleExportAudit}
            className="px-3 py-1.5 rounded bg-surface-elevated hover:bg-surface-elevated/80 text-text-secondary hover:text-text-primary border border-surface-border font-mono text-xs flex items-center space-x-1.5 transition-colors shadow-panel"
          >
            <Download className="w-3.5 h-3.5 text-text-muted" />
            <span>Export Config JSON</span>
          </motion.button>
        }
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Pre-Flight Gating Policy */}
        <motion.div
          variants={fadeInVariants}
          className="liquid-glass-card rounded-2xl p-5 space-y-4 shadow-sm"
        >
          <div className="flex items-center space-x-2 border-b border-surface-border pb-3">
            <ShieldCheck className="w-4 h-4 text-sage" />
            <h2 className="text-sm font-semibold text-text-primary">
              Automated Release Gating Rules
            </h2>
          </div>

          <div className="space-y-4 font-mono text-xs">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-text-secondary font-semibold">
                  Risk Tolerance Threshold Index:
                </label>
                <span className="text-risk-warning font-bold">
                  {settings.riskToleranceThreshold} / 100
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="95"
                value={settings.riskToleranceThreshold}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    riskToleranceThreshold: Number(e.target.value),
                  })
                }
                className="w-full accent-signal cursor-pointer"
              />
              <span className="text-[11px] text-text-muted block font-sans">
                Deployments scoring higher than this index are automatically intercepted and flagged for manual verification sign-off.
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-surface-border">
              <div>
                <span className="text-text-primary font-semibold block">
                  Auto-Block Critical Risk Releases
                </span>
                <span className="text-text-muted text-[11px] font-sans">
                  Block CI/CD deployment pipelines immediately when risk classification is CRITICAL.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.autoBlockCriticalRisk}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    autoBlockCriticalRisk: e.target.checked,
                  })
                }
                className="w-4 h-4 accent-signal rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-surface-border">
              <div>
                <span className="text-text-primary font-semibold block">
                  Mandate Engineer Sign-Off on Environment Drift
                </span>
                <span className="text-text-muted text-[11px] font-sans">
                  Require explicit verification if database scale, connection pool, or TLS cipher drift is detected.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.requireEngineerSignoffOnDrift}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    requireEngineerSignoffOnDrift: e.target.checked,
                  })
                }
                className="w-4 h-4 accent-signal rounded cursor-pointer"
              />
            </div>
          </div>
        </motion.div>

        {/* Section 2: Hindsight Memory Engine Retention */}
        <motion.div
          variants={fadeInVariants}
          className="liquid-glass-card rounded-2xl p-5 space-y-4 shadow-sm"
        >
          <div className="flex items-center space-x-2 border-b border-surface-border pb-3">
            <BrainCircuit className="w-4 h-4 text-signal" />
            <h2 className="text-sm font-semibold text-text-primary">
              Vectorize Hindsight Memory Engine Policy
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            <div>
              <label className="text-text-muted block mb-1">Hindsight API Endpoint:</label>
              <input
                type="text"
                value={settings.hindsightApiEndpoint}
                onChange={(e) =>
                  setSettings({ ...settings, hindsightApiEndpoint: e.target.value })
                }
                className="w-full bg-surface-elevated border border-surface-border p-2 rounded text-text-primary focus:outline-none focus:border-signal font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-text-muted block mb-1">Isolated Bank ID:</label>
              <input
                type="text"
                value={settings.hindsightClusterId}
                onChange={(e) =>
                  setSettings({ ...settings, hindsightClusterId: e.target.value })
                }
                className="w-full bg-surface-elevated border border-surface-border p-2 rounded text-text-primary focus:outline-none focus:border-signal font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-text-muted block mb-1">Memory Retention (Days):</label>
              <input
                type="number"
                value={settings.memoryRetentionDays}
                onChange={(e) =>
                  setSettings({ ...settings, memoryRetentionDays: Number(e.target.value) })
                }
                className="w-full bg-surface-elevated border border-surface-border p-2 rounded text-text-primary focus:outline-none focus:border-signal font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-text-muted block mb-1">Telemetry Log Retention (Days):</label>
              <input
                type="number"
                value={settings.telemetryLogRetentionDays}
                onChange={(e) =>
                  setSettings({ ...settings, telemetryLogRetentionDays: Number(e.target.value) })
                }
                className="w-full bg-surface-elevated border border-surface-border p-2 rounded text-text-primary focus:outline-none focus:border-signal font-mono text-xs"
              />
            </div>
          </div>
        </motion.div>

        {/* Section 3: Incident Notifications & Webhooks */}
        <motion.div
          variants={fadeInVariants}
          className="liquid-glass-card rounded-2xl p-5 space-y-4 shadow-sm"
        >
          <div className="flex items-center space-x-2 border-b border-surface-border pb-3">
            <Bell className="w-4 h-4 text-risk-warning" />
            <h2 className="text-sm font-semibold text-text-primary">
              Notification & War-Room Webhooks
            </h2>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <label className="text-text-muted block mb-1">Slack Channel Incoming Webhook:</label>
              <input
                type="text"
                value={settings.slackWebhookUrl}
                onChange={(e) =>
                  setSettings({ ...settings, slackWebhookUrl: e.target.value })
                }
                className="w-full bg-surface-elevated border border-surface-border p-2 rounded text-text-primary focus:outline-none focus:border-signal font-mono text-xs"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-text-muted block mb-1">Datadog API Key (Masked):</label>
                <input
                  type="text"
                  value={settings.datadogApiKeyMasked}
                  onChange={(e) =>
                    setSettings({ ...settings, datadogApiKeyMasked: e.target.value })
                  }
                  className="w-full bg-surface-elevated border border-surface-border p-2 rounded text-text-primary focus:outline-none focus:border-signal font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-text-muted block mb-1">PagerDuty Service Key (Masked):</label>
                <input
                  type="text"
                  value={settings.pagerdutyServiceKeyMasked}
                  onChange={(e) =>
                    setSettings({ ...settings, pagerdutyServiceKeyMasked: e.target.value })
                  }
                  className="w-full bg-surface-elevated border border-surface-border p-2 rounded text-text-primary focus:outline-none focus:border-signal font-mono text-xs"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Save Button */}
        <div className="flex justify-end space-x-3 font-mono text-xs">
          <motion.button
            whileHover={hoverSubtle}
            whileTap={tapSubtle}
            type="submit"
            className="px-6 py-3 rounded-full btn-catchy-primary font-semibold flex items-center space-x-2 shadow-lg hover:shadow-xl active:scale-95 transition-all text-xs cursor-pointer"
          >
            <Save className="w-4 h-4 text-amber-300" />
            <span>SAVE WORKSPACE SETTINGS</span>
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
}

