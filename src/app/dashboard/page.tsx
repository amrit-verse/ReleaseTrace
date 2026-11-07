"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Activity,
  ArrowUpRight,
  BrainCircuit,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Database,
  GitCommit,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  WifiOff,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";

type Assessment = {
  overallCategory?: string | null;
  summary?: string | null;
  groundedExplanation?: string | null;
  recommendedAction?: string | null;
  fallbackUsed?: boolean;
};

type DeploymentRow = {
  id: string;
  providerDeploymentId?: string;
  commitSha?: string;
  branch?: string;
  environment?: string;
  status?: string;
  url?: string | null;
  createdAt?: string;
  startedAt?: string;
  assessment?: Assessment | null;
};

type DashboardStats = {
  projectId: string;
  bankId: string;
  totalDeployments: number;
  activeAssessments: number;
  criticalBlockedCount: number;
  verifiedPrecedentsCount: number;
  deterministicRuleCount: number;
  latestDeployments: DeploymentRow[];
  isMock: boolean;
  databaseStatus: "CONNECTED" | "UNAVAILABLE";
  hindsightStatus: "CONNECTED" | "MOCK_MODE" | "UNAVAILABLE";
};

function formatDate(value?: string) {
  if (!value) return "Time unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time unavailable";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function label(value?: string | null) {
  if (!value) return "Unknown";
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function riskStyle(value?: string | null) {
  switch ((value || "").toUpperCase()) {
    case "CRITICAL":
      return "border-red-200 bg-red-50 text-red-800";
    case "HIGH":
    case "HIGH_RISK":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "ELEVATED":
      return "border-orange-200 bg-orange-50 text-orange-800";
    case "NOMINAL":
    case "VERIFIED":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    default:
      return "border-surface-border bg-surface-subtle text-text-secondary";
  }
}

function StatePill({ value }: { value?: string | null }) {
  return (
    <span className="inline-flex items-center rounded-full border border-surface-border bg-surface-subtle px-2.5 py-1 text-[10px] font-mono font-semibold uppercase tracking-wide text-text-secondary">
      {label(value)}
    </span>
  );
}

function MetricCard({
  title,
  value,
  detail,
  icon: Icon,
  tone = "text-signal",
}: {
  title: string;
  value: number | string;
  detail: string;
  icon: typeof Activity;
  tone?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex min-h-36 flex-col justify-between rounded-xl border border-surface-border bg-surface p-4 shadow-panel-subtle"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-text-muted">
          {title}
        </span>
        <Icon className={`h-[18px] w-[18px] ${tone}`} />
      </div>
      <div>
        <div className="text-3xl font-bold tracking-tight text-text-primary tabular-nums">{value}</div>
        <p className="mt-1 text-xs leading-relaxed text-text-muted">{detail}</p>
      </div>
    </motion.section>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const response = await fetch("/api/dashboard/stats", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || `Dashboard request failed (HTTP ${response.status})`);
      }
      setStats(payload as DashboardStats);
      if (payload.databaseStatus === "UNAVAILABLE") {
        setError("The database could not be reached. Counts and release history may be incomplete.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load dashboard data.");
      setStats(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const latest = stats?.latestDeployments?.[0];
  const databaseUnavailable = stats?.databaseStatus === "UNAVAILABLE";
  const hindsightUnavailable = stats?.hindsightStatus === "UNAVAILABLE";
  const dataLabel = !stats
    ? "Awaiting data"
    : databaseUnavailable
      ? "Database unavailable"
      : stats.isMock
        ? "Fixture / mock data"
        : "Live project data";

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 lg:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          title="Release operations"
          subtitle="A project-scoped view of deployment events, deterministic checks and historical memory."
          badge={
            <span className="rounded-full border border-surface-border bg-surface px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-text-secondary">
              {dataLabel}
            </span>
          }
        />
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading || refreshing}
          className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-lg border border-surface-border bg-surface px-3 py-2 text-xs font-semibold text-text-secondary shadow-panel-subtle transition hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh data
        </button>
      </div>

      {error && (
        <div role="status" className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <WifiOff className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Some dashboard data is unavailable</p>
            <p className="mt-0.5 text-xs leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {loading && !stats ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-36 animate-pulse rounded-xl border border-surface-border bg-surface-subtle" />
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard
              title="Deployments"
              value={stats.totalDeployments}
              detail="Recorded for this project"
              icon={GitCommit}
            />
            <MetricCard
              title="Assessments"
              value={stats.activeAssessments}
              detail="Persisted risk assessments"
              icon={Activity}
              tone="text-signal"
            />
            <MetricCard
              title="Critical findings"
              value={stats.criticalBlockedCount}
              detail="Assessments classified as critical"
              icon={ShieldAlert}
              tone="text-red-600"
            />
            <MetricCard
              title="Memory documents"
              value={stats.verifiedPrecedentsCount}
              detail="Documents indexed in this project bank"
              icon={BrainCircuit}
              tone="text-emerald-700"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <section className="rounded-xl border border-surface-border bg-surface p-4 shadow-panel-subtle xl:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-border pb-3">
                <div>
                  <h2 className="flex items-center gap-2 text-sm font-bold text-text-primary">
                    <GitCommit className="h-4 w-4 text-signal" />
                    Recent releases
                  </h2>
                  <p className="mt-1 text-xs text-text-muted">Latest deployment events stored for this project.</p>
                </div>
                <Link href="/deployments" className="inline-flex items-center gap-1 text-xs font-semibold text-signal hover:underline">
                  Open register <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {stats.latestDeployments.length === 0 ? (
                <div className="flex min-h-44 flex-col items-center justify-center px-4 text-center">
                  <GitCommit className="h-7 w-7 text-text-muted" />
                  <p className="mt-3 text-sm font-semibold text-text-primary">No releases recorded yet</p>
                  <p className="mt-1 max-w-sm text-xs leading-relaxed text-text-muted">
                    Send a signed deployment event from your CI workflow to populate this register.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-surface-border">
                  {stats.latestDeployments.map((deployment) => (
                    <div key={deployment.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase ${riskStyle(deployment.assessment?.overallCategory)}`}>
                            {label(deployment.assessment?.overallCategory || "Not assessed")}
                          </span>
                          <StatePill value={deployment.status} />
                          <span className="text-[10px] text-text-muted">{label(deployment.environment)}</span>
                        </div>
                        <p className="mt-1.5 truncate font-mono text-xs font-semibold text-text-primary">
                          {deployment.commitSha ? deployment.commitSha.slice(0, 12) : deployment.providerDeploymentId || deployment.id}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-text-muted">
                          {deployment.branch ? `Branch ${deployment.branch} · ` : ""}{formatDate(deployment.startedAt || deployment.createdAt)}
                        </p>
                        {deployment.assessment?.summary && (
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-text-secondary">{deployment.assessment.summary}</p>
                        )}
                      </div>
                      <Link
                        href={`/deployments/${deployment.id}`}
                        className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1 rounded-lg border border-surface-border px-3 py-2 text-xs font-semibold text-text-secondary transition hover:bg-surface-subtle hover:text-signal"
                      >
                        Inspect <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <aside className="space-y-4">
              <section className="rounded-xl border border-surface-border bg-surface p-4 shadow-panel-subtle">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-signal" />
                  <h2 className="text-sm font-bold text-text-primary">Integration health</h2>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-text-secondary">Neon PostgreSQL</span>
                    <span className={`text-[10px] font-mono font-semibold uppercase ${databaseUnavailable ? "text-red-700" : "text-emerald-700"}`}>
                      {databaseUnavailable ? "Unavailable" : "Connected"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-text-secondary">Hindsight memory</span>
                    <span className={`text-[10px] font-mono font-semibold uppercase ${hindsightUnavailable ? "text-red-700" : stats.hindsightStatus === "MOCK_MODE" ? "text-amber-700" : "text-emerald-700"}`}>
                      {label(stats.hindsightStatus)}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3 border-t border-surface-border pt-3">
                    <span className="text-xs text-text-muted">Memory bank</span>
                    <code className="max-w-[60%] break-all text-right text-[10px] text-text-secondary">{stats.bankId}</code>
                  </div>
                </div>
                <Link href="/integrations" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-signal hover:underline">
                  View diagnostics <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </section>

              <section className="rounded-xl border border-surface-border bg-brand-subtle/60 p-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-signal" />
                  <h2 className="text-sm font-bold text-text-primary">Deterministic checks</h2>
                </div>
                <p className="mt-2 text-3xl font-bold tabular-nums text-text-primary">{stats.deterministicRuleCount}</p>
                <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                  Rules registered in the current risk engine. Historical memory informs recommendations; current evidence determines the assessment.
                </p>
                <div className="mt-3 flex items-center gap-2 text-[10px] text-text-muted">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Rule count from the live registry</span>
                </div>
              </section>
            </aside>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-surface-border bg-surface p-8 text-center shadow-panel-subtle">
          <CircleAlert className="mx-auto h-8 w-8 text-amber-600" />
          <h2 className="mt-3 text-sm font-semibold text-text-primary">Dashboard could not load</h2>
          <p className="mt-1 text-xs text-text-muted">{error || "The API did not return dashboard data."}</p>
          <button type="button" onClick={() => void refresh()} className="mt-4 rounded-lg bg-signal px-4 py-2 text-xs font-semibold text-white hover:opacity-90">
            Try again
          </button>
        </div>
      )}

      {stats && (
        <p className="flex items-center gap-2 text-[10px] text-text-muted" aria-live="polite">
          <Clock3 className="h-3 w-3" />
          Project {stats.projectId} · {stats.isMock ? "Mock transport" : "Live transport"} · Refresh to fetch the latest values
        </p>
      )}
    </div>
  );
}
