"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Database,
  Github,
  RefreshCw,
  Server,
  Workflow,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";

type ProviderStatus =
  | "CONNECTED"
  | "NOT_CONFIGURED"
  | "UNAVAILABLE"
  | "AUTHENTICATION_FAILED"
  | "MOCK_MODE"
  | "CONFIGURED";

type HealthResult = {
  status: ProviderStatus;
  latencyMs: number;
  lastHeartbeat: string;
  error?: string;
};

type HealthResponse = {
  results: Record<string, HealthResult>;
};

const providers = [
  { id: "hindsight", name: "Hindsight Cloud", description: "Persistent engineering memory and incident recall.", icon: BrainCircuit },
  { id: "groq", name: "Groq", description: "Grounded language-model explanations and recommendations.", icon: Zap },
  { id: "neon", name: "Neon PostgreSQL", description: "Deployment, assessment and resolution persistence.", icon: Database },
  { id: "vercel", name: "Vercel", description: "Deployment platform API authentication.", icon: Activity },
  { id: "inngest", name: "Inngest", description: "Durable background processing and event workflows.", icon: Workflow },
  { id: "github", name: "GitHub", description: "CI event ingress and repository API connectivity.", icon: Github },
] as const;

function statusPresentation(status?: ProviderStatus) {
  switch (status) {
    case "CONNECTED":
      return { label: "Connected", className: "border-emerald-200 bg-emerald-50 text-emerald-800", icon: CheckCircle2 };
    case "CONFIGURED":
      return { label: "Configured · not probed", className: "border-sky-200 bg-sky-50 text-sky-800", icon: Clock3 };
    case "MOCK_MODE":
      return { label: "Mock transport", className: "border-amber-200 bg-amber-50 text-amber-800", icon: AlertCircle };
    case "AUTHENTICATION_FAILED":
      return { label: "Authentication failed", className: "border-red-200 bg-red-50 text-red-800", icon: AlertCircle };
    case "UNAVAILABLE":
      return { label: "Unavailable", className: "border-red-200 bg-red-50 text-red-800", icon: AlertCircle };
    case "NOT_CONFIGURED":
      return { label: "Not configured", className: "border-surface-border bg-surface-subtle text-text-secondary", icon: Clock3 };
    default:
      return { label: "Not checked", className: "border-surface-border bg-surface-subtle text-text-muted", icon: Clock3 };
  }
}

function checkedAt(value?: string) {
  if (!value) return "Not checked";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Time unavailable"
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default function IntegrationsPage() {
  const [results, setResults] = useState<Record<string, HealthResult> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const runHealthChecks = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/integrations/health", {
        cache: "no-store",
        signal,
      });
      const payload = (await response.json()) as HealthResponse & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || `Health checks failed (HTTP ${response.status})`);
      }
      setResults(payload.results || {});
      setLastUpdated(new Date().toISOString());
    } catch (cause) {
      if (cause instanceof Error && cause.name === "AbortError") return;
      setError(cause instanceof Error ? cause.message : "Could not retrieve integration health.");
      setResults(null);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void runHealthChecks(controller.signal);
    return () => controller.abort();
  }, [runHealthChecks]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 lg:p-6">
      <PageHeader
        title="Integration health"
        subtitle="Live connectivity checks for the services used by the ReleaseTrace runtime. Credentials are never returned to this page."
        badge={
          <span className="rounded-full border border-surface-border bg-surface px-2.5 py-1 font-mono text-[10px] font-semibold uppercase text-text-secondary">
            {results ? Object.keys(results).length + " checks" : "Health diagnostics"}
          </span>
        }
        actions={
          <button
            type="button"
            onClick={() => void runHealthChecks()}
            disabled={loading}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-surface-border bg-surface px-3 py-2 text-xs font-semibold text-text-secondary shadow-panel-subtle transition hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Checking…" : "Run health checks"}
          </button>
        }
      />

      <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs leading-relaxed text-sky-900">
        These results come from server-side provider probes. “Configured” means credentials or integration keys are present, but the health endpoint did not perform a live connectivity check for that provider.
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Health checks could not be completed</p>
            <p className="mt-0.5 text-xs">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {providers.map((provider) => {
          const Icon = provider.icon;
          const result = results?.[provider.id];
          const presentation = statusPresentation(result?.status);
          const StatusIcon = presentation.icon;

          return (
            <section
              key={provider.id}
              className="flex min-h-52 flex-col justify-between rounded-xl border border-surface-border bg-surface p-4 shadow-panel-subtle"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-subtle text-signal">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 className="text-sm font-bold text-text-primary">{provider.name}</h2>
                      <p className="mt-0.5 text-[10px] font-mono uppercase tracking-wide text-text-muted">{provider.id}</p>
                    </div>
                  </div>
                  <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold ${presentation.className}`}>
                    <StatusIcon className="h-3 w-3" />
                    {presentation.label}
                  </span>
                </div>
                <p className="mt-4 text-xs leading-relaxed text-text-secondary">{provider.description}</p>
              </div>

              <div className="mt-5 space-y-2 border-t border-surface-border pt-3">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-text-muted">Probe latency</span>
                  <span className="font-mono font-semibold text-text-primary">
                    {result && result.latencyMs > 0 ? `${result.latencyMs} ms` : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-text-muted">Last checked</span>
                  <span className="text-right font-mono text-[10px] text-text-secondary">
                    {checkedAt(result?.lastHeartbeat)}
                  </span>
                </div>
                {result?.error && (
                  <p className="break-words rounded-md bg-red-50 px-2 py-1.5 text-[10px] leading-relaxed text-red-800">
                    {result.error}
                  </p>
                )}
                {!result && loading && (
                  <div className="h-1.5 animate-pulse rounded-full bg-surface-subtle" />
                )}
              </div>
            </section>
          );
        })}
      </div>

      <p className="flex items-center gap-2 text-[10px] text-text-muted" aria-live="polite">
        <Server className="h-3 w-3" />
        {lastUpdated ? `Last health request: ${checkedAt(lastUpdated)}` : "Waiting for health results"}
        {loading ? " · Running provider checks" : ""}
      </p>
    </div>
  );
}
