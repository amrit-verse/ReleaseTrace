"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  GitCommit,
  RefreshCw,
  Search,
  WifiOff,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { PlainEnglishCallout } from "@/components/ui/PlainEnglishCallout";
import { useDevOpsGuide } from "@/context/DevOpsGuideContext";

type DeploymentRow = {
  id: string;
  provider: string;
  providerDeploymentId: string;
  commitSha: string;
  branch: string;
  environment: string;
  status: string;
  url: string | null;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  assessment: {
    overallCategory: string;
    summary: string;
    recommendedAction: string;
  } | null;
};

type DeploymentResponse = {
  projectId: string;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  deployments: DeploymentRow[];
};

function titleCase(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function dateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Time unavailable"
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function StatusPill({ value, risk = false }: { value: string; risk?: boolean }) {
  const normalized = value.toUpperCase();
  const style = risk
    ? normalized === "CRITICAL"
      ? "border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-400"
      : normalized === "HIGH_RISK" || normalized === "HIGH"
        ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-400"
        : normalized === "ELEVATED"
          ? "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-500/30 dark:bg-orange-500/15 dark:text-orange-400"
          : normalized === "VERIFIED" || normalized === "NOMINAL"
            ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400"
            : "border-surface-border bg-surface-subtle text-text-secondary"
    : normalized === "SUCCEEDED" || normalized === "READY" || normalized === "PASSED"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400"
      : normalized === "FAILED" || normalized === "ERROR" || normalized === "BLOCKED"
        ? "border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-400"
        : normalized === "CANCELED" || normalized === "ROLLED_BACK"
          ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-400"
          : "border-surface-border bg-surface-subtle text-text-secondary";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase ${style}`}>
      {titleCase(value)}
    </span>
  );
}

export default function DeploymentsHistoryPage() {
  const { setIsSimulatorModalOpen } = useDevOpsGuide();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [environment, setEnvironment] = useState("ALL");
  const [pageNumber, setPageNumber] = useState(1);
  const [data, setData] = useState<DeploymentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      page: String(pageNumber),
      pageSize: "20",
      status,
      environment,
    });
    if (query.trim()) params.set("q", query.trim());

    setLoading(true);
    setError(null);

    fetch(`/api/deployments?${params.toString()}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || `Request failed (HTTP ${response.status})`);
        return payload as DeploymentResponse;
      })
      .then(setData)
      .catch((cause: unknown) => {
        if (cause instanceof Error && cause.name === "AbortError") return;
        setError(cause instanceof Error ? cause.message : "Could not load deployment history.");
        setData(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [query, status, environment, pageNumber, refreshKey]);

  useEffect(() => {
    setPageNumber(1);
  }, [query, status, environment]);

  const visibleRange = useMemo(() => {
    if (!data || data.total === 0) return "0 releases";
    const first = (data.page - 1) * data.pageSize + 1;
    const last = Math.min(data.page * data.pageSize, data.total);
    return `${first}–${last} of ${data.total}`;
  }, [data]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 lg:p-6">
      <PageHeader
        title="Deployment register"
        subtitle="Recorded deployment events and their persisted risk assessments for this project."
        badge={
          <span className="rounded-full border border-surface-border bg-surface px-2.5 py-1 font-mono text-[10px] font-semibold uppercase text-text-secondary">
            {data ? visibleRange : "Live data"}
          </span>
        }
        actions={
          <button
            type="button"
            onClick={() => setRefreshKey((key) => key + 1)}
            disabled={loading}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-surface-border bg-surface px-3 py-2 text-xs font-semibold text-text-secondary transition hover:bg-surface-subtle disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        }
      />

      <PlainEnglishCallout
        title="The Deployment Register Explained"
        analogy="Think of this page as an airport flight log or a hospital admission ledger. Every single time code attempts to fly to staging or production, an immutable audit trail entry is recorded here with its safety verdict."
        explanation="Release events are received via GitHub Actions webhooks and Vercel deployment webhooks. Each entry captures the exact Git commit SHA, author, branch, target environment (preview, staging, or production), and the AI Pre-Flight Gate risk verdict."
        whyItMatters="In professional DevOps, traceability is everything. If an outage occurs, the deployment register instantly tells the team: What changed? Who deployed it? Did CI flag any warnings? And what was the blast radius?"
        keyTerms={["Immutable Audit Trail", "Git Commit SHA", "Staging vs Production", "Pre-Flight Gate Decision"]}
        suggestedAction={{
          label: "Simulate a release event",
          onClick: () => setIsSimulatorModalOpen(true),
        }}
      />

      <section className="rounded-xl border border-surface-border bg-surface p-3 shadow-panel-subtle">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px]">
          <label className="relative block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search commit, branch or provider deployment ID"
              className="min-h-10 w-full rounded-lg border border-surface-border bg-surface-subtle pl-9 pr-3 text-xs text-text-primary outline-none transition placeholder:text-text-muted focus:border-signal"
            />
          </label>
          <select
            aria-label="Filter by status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="min-h-10 rounded-lg border border-surface-border bg-surface-subtle px-3 text-xs text-text-secondary outline-none focus:border-signal"
          >
            <option value="ALL">All statuses</option>
            <option value="READY">Ready</option>
            <option value="ERROR">Error</option>
            <option value="CANCELED">Canceled</option>
            <option value="BLOCKED">Blocked</option>
            <option value="IN_PROGRESS">In progress</option>
          </select>
          <select
            aria-label="Filter by environment"
            value={environment}
            onChange={(event) => setEnvironment(event.target.value)}
            className="min-h-10 rounded-lg border border-surface-border bg-surface-subtle px-3 text-xs text-text-secondary outline-none focus:border-signal"
          >
            <option value="ALL">All environments</option>
            <option value="production">Production</option>
            <option value="preview">Preview</option>
            <option value="staging">Staging</option>
          </select>
        </div>
      </section>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          <WifiOff className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Could not retrieve deployment history</p>
            <p className="mt-0.5 text-xs">{error}</p>
          </div>
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-surface-border bg-surface shadow-panel-subtle">
        <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
          <div>
            <h2 className="text-sm font-bold text-text-primary">Release events</h2>
            <p className="mt-0.5 text-xs text-text-muted">Sorted by most recently recorded.</p>
          </div>
          {loading && (
            <span className="text-[10px] font-mono uppercase text-text-muted flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-signal animate-ping"></span>
              Streaming events…
            </span>
          )}
        </div>

        {loading && (
          <div className="divide-y divide-surface-border">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-20 rounded-full liquid-skeleton"></div>
                    <div className="h-5 w-16 rounded-full liquid-skeleton"></div>
                    <div className="h-3 w-28 rounded liquid-skeleton"></div>
                  </div>
                  <div className="h-4 w-48 rounded liquid-skeleton"></div>
                  <div className="h-3 w-36 rounded liquid-skeleton"></div>
                  <div className="h-3 w-3/4 rounded liquid-skeleton"></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-9 w-24 rounded-lg liquid-skeleton"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && data?.deployments.length === 0 && (
          <div className="flex min-h-56 flex-col items-center justify-center px-4 text-center">
            <GitCommit className="h-8 w-8 text-text-muted" />
            <p className="mt-3 text-sm font-semibold text-text-primary">No matching releases</p>
            <p className="mt-1 max-w-sm text-xs leading-relaxed text-text-muted">
              No deployment events match these filters. Clear the search or wait for the next signed CI event.
            </p>
          </div>
        )}

        {data && data.deployments.length > 0 && (
          <div className="divide-y divide-surface-border">
            {data.deployments.map((deployment) => (
              <article key={deployment.id} className="flex flex-col gap-3 p-4 transition hover:bg-brand-subtle/30 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill value={deployment.status} />
                    {deployment.assessment && <StatusPill value={deployment.assessment.overallCategory} risk />}
                    <span className="text-[10px] font-mono uppercase tracking-wide text-text-muted">
                      {titleCase(deployment.provider)} · {titleCase(deployment.environment)}
                    </span>
                  </div>
                  <p className="truncate font-mono text-xs font-semibold text-text-primary">
                    {deployment.commitSha ? deployment.commitSha.slice(0, 12) : deployment.providerDeploymentId}
                  </p>
                  <p className="text-xs text-text-muted">
                    {deployment.branch ? `Branch ${deployment.branch} · ` : ""}{dateTime(deployment.startedAt || deployment.createdAt)}
                  </p>
                  {deployment.assessment?.summary && (
                    <p className="max-w-3xl text-xs leading-relaxed text-text-secondary">
                      {deployment.assessment.summary}
                    </p>
                  )}
                  {deployment.assessment?.recommendedAction && (
                    <p className="max-w-3xl text-xs leading-relaxed text-signal">
                      Next: {deployment.assessment.recommendedAction}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/deployments/${deployment.id}`}
                    className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-surface-border bg-surface px-3 py-2 text-xs font-semibold text-text-secondary transition hover:bg-surface-subtle hover:text-signal"
                  >
                    View report
                  </Link>
                  {deployment.url ? (
                    <a
                      href={deployment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-surface-border bg-surface px-3 py-2 text-xs font-semibold text-text-secondary transition hover:bg-surface-subtle hover:text-signal"
                    >
                      Provider <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-surface-border px-4 py-3">
            <span className="text-xs text-text-muted">Page {data.page} of {data.totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPageNumber((value) => Math.max(1, value - 1))}
                disabled={pageNumber <= 1 || loading}
                className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-surface-border px-3 text-xs font-semibold text-text-secondary disabled:opacity-40"
              >
                <ArrowDown className="h-3.5 w-3.5 rotate-90" /> Previous
              </button>
              <button
                type="button"
                onClick={() => setPageNumber((value) => Math.min(data.totalPages, value + 1))}
                disabled={pageNumber >= data.totalPages || loading}
                className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-surface-border px-3 text-xs font-semibold text-text-secondary disabled:opacity-40"
              >
                Next <ArrowUp className="h-3.5 w-3.5 rotate-90" />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
