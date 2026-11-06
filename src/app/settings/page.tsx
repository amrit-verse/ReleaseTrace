"use client";

import React, { useState } from "react";
import {
  SlidersHorizontal,
  BrainCircuit,
  ShieldCheck,
  Bell,
  Save,
  RotateCcw,
  Sparkles,
  Download,
  AlertOctagon,
} from "lucide-react";
import { mockDefaultSettings } from "@/data/mockData";
import { WorkspaceSettings } from "@/types";

export default function SettingsPage() {
  const [settings, setSettings] = useState<WorkspaceSettings>(mockDefaultSettings);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("Workspace configuration successfully updated and distributed to CI runners.");
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
    showToast("Settings audit archive exported.");
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-5xl mx-auto w-full font-sans">
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
            <span>Workspace & Policy Configuration</span>
            <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-surface-subtle text-zinc-400 border border-surface-border">
              CONFIG V2.4
            </span>
          </h1>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">
            Pre-flight gating policies, Hindsight memory retention windows, and notification webhooks
          </p>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs">
          <button
            onClick={handleExportAudit}
            className="px-3 py-1.5 rounded bg-surface-subtle hover:bg-surface-border text-zinc-300 border border-surface-border flex items-center space-x-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span>Export Config JSON</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Pre-Flight Gating Policy */}
        <div className="bg-surface border border-surface-border rounded-lg p-5 space-y-4">
          <div className="flex items-center space-x-2 border-b border-surface-border pb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-zinc-100">
              Automated Release Gating Rules
            </h2>
          </div>

          <div className="space-y-4 font-mono text-xs">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-zinc-300 font-semibold">
                  Risk Tolerance Threshold Index:
                </label>
                <span className="text-amber-400 font-bold">
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
                className="w-full accent-purple-500 cursor-pointer"
              />
              <span className="text-[11px] text-zinc-500 block font-sans">
                Deployments scoring higher than this index are automatically intercepted and flagged for Staff Engineer review.
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-surface-border/50">
              <div>
                <span className="text-zinc-200 font-semibold block">
                  Auto-Block Critical Risk Releases
                </span>
                <span className="text-zinc-500 text-[11px] font-sans">
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
                className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-surface-border/50">
              <div>
                <span className="text-zinc-200 font-semibold block">
                  Mandate Engineer Sign-Off on Environment Drift
                </span>
                <span className="text-zinc-500 text-[11px] font-sans">
                  Require explicit verification if row-count, node kernel, or TLS cipher drift is detected.
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
                className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Hindsight Memory Engine Retention */}
        <div className="bg-surface border border-surface-border rounded-lg p-5 space-y-4">
          <div className="flex items-center space-x-2 border-b border-surface-border pb-3">
            <BrainCircuit className="w-4 h-4 text-brand-hindsight" />
            <h2 className="text-sm font-semibold text-zinc-100">
              Vectorize Hindsight Memory Engine Policy
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            <div>
              <label className="text-zinc-400 block mb-1">Hindsight API Endpoint:</label>
              <input
                type="text"
                value={settings.hindsightApiEndpoint}
                onChange={(e) =>
                  setSettings({ ...settings, hindsightApiEndpoint: e.target.value })
                }
                className="w-full bg-surface-subtle border border-surface-border p-2 rounded text-zinc-200 focus:outline-none focus:border-brand-hindsight"
              />
            </div>

            <div>
              <label className="text-zinc-400 block mb-1">Cluster ID:</label>
              <input
                type="text"
                value={settings.hindsightClusterId}
                onChange={(e) =>
                  setSettings({ ...settings, hindsightClusterId: e.target.value })
                }
                className="w-full bg-surface-subtle border border-surface-border p-2 rounded text-zinc-200 focus:outline-none focus:border-brand-hindsight"
              />
            </div>

            <div>
              <label className="text-zinc-400 block mb-1">Memory Retention (Days):</label>
              <input
                type="number"
                value={settings.memoryRetentionDays}
                onChange={(e) =>
                  setSettings({ ...settings, memoryRetentionDays: Number(e.target.value) })
                }
                className="w-full bg-surface-subtle border border-surface-border p-2 rounded text-zinc-200 focus:outline-none focus:border-brand-hindsight"
              />
            </div>

            <div>
              <label className="text-zinc-400 block mb-1">Telemetry Log Retention (Days):</label>
              <input
                type="number"
                value={settings.telemetryLogRetentionDays}
                onChange={(e) =>
                  setSettings({ ...settings, telemetryLogRetentionDays: Number(e.target.value) })
                }
                className="w-full bg-surface-subtle border border-surface-border p-2 rounded text-zinc-200 focus:outline-none focus:border-brand-hindsight"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Incident Notifications & Webhooks */}
        <div className="bg-surface border border-surface-border rounded-lg p-5 space-y-4">
          <div className="flex items-center space-x-2 border-b border-surface-border pb-3">
            <Bell className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-zinc-100">
              Notification & War-Room Webhooks
            </h2>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <label className="text-zinc-400 block mb-1">Slack Channel Incoming Webhook:</label>
              <input
                type="text"
                value={settings.slackWebhookUrl}
                onChange={(e) =>
                  setSettings({ ...settings, slackWebhookUrl: e.target.value })
                }
                className="w-full bg-surface-subtle border border-surface-border p-2 rounded text-zinc-200 focus:outline-none focus:border-brand-hindsight"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-zinc-400 block mb-1">Datadog API Key (Masked):</label>
                <input
                  type="text"
                  value={settings.datadogApiKeyMasked}
                  onChange={(e) =>
                    setSettings({ ...settings, datadogApiKeyMasked: e.target.value })
                  }
                  className="w-full bg-surface-subtle border border-surface-border p-2 rounded text-zinc-200 focus:outline-none focus:border-brand-hindsight"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">PagerDuty Service Key (Masked):</label>
                <input
                  type="text"
                  value={settings.pagerdutyServiceKeyMasked}
                  onChange={(e) =>
                    setSettings({ ...settings, pagerdutyServiceKeyMasked: e.target.value })
                  }
                  className="w-full bg-surface-subtle border border-surface-border p-2 rounded text-zinc-200 focus:outline-none focus:border-brand-hindsight"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end space-x-3 font-mono text-xs">
          <button
            type="submit"
            className="px-5 py-2.5 rounded bg-brand-hindsight hover:bg-brand-hindsight-dark text-white font-semibold flex items-center space-x-2 shadow-glow-hindsight transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>SAVE WORKSPACE SETTINGS</span>
          </button>
        </div>
      </form>
    </div>
  );
}
