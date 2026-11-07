"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  BrainCircuit,
  CheckCircle2,
  Database,
  RefreshCw,
  Search,
  Tag,
  WifiOff,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { PlainEnglishCallout } from "@/components/ui/PlainEnglishCallout";
import { useDevOpsGuide } from "@/context/DevOpsGuideContext";

type RecallMemory = {
  id?: string;
  memoryId?: string;
  text?: string;
  content?: string;
  context?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  scores?: {
    final?: number;
    semantic?: number;
  };
  [key: string]: unknown;
};

type MemoryResponse = {
  status: string;
  bankId: string;
  projectId: string;
  total: number;
  memories: RecallMemory[];
  source: string;
  isMock?: boolean;
};

function metadataValue(metadata: Record<string, unknown> | undefined, keys: string[]) {
  for (const key of keys) {
    const value = metadata?.[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return undefined;
}

function memoryBody(memory: RecallMemory) {
  if (typeof memory.text === "string" && memory.text.trim()) return memory.text;
  if (typeof memory.content === "string" && memory.content.trim()) return memory.content;
  if (typeof memory.context === "string" && memory.context.trim()) return memory.context;
  return JSON.stringify(memory, null, 2);
}

function scoreLabel(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return `${(Math.max(0, Math.min(1, value)) * 100).toFixed(1)}%`;
}

export default function MemoryExplorerPage() {
  const { openGlossary } = useDevOpsGuide();
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [data, setData] = useState<MemoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadMemories = useCallback(async (search: string, signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      const suffix = params.toString();
      const response = await fetch(`/api/memories${suffix ? `?${suffix}` : ""}`, {
        cache: "no-store",
        signal,
      });
      const payload = (await response.json()) as MemoryResponse & { error?: string; details?: string };
      if (!response.ok) {
        throw new Error(payload.error || payload.details || `Memory recall failed (HTTP ${response.status})`);
      }
      setData(payload);
    } catch (cause) {
      if (cause instanceof Error && cause.name === "AbortError") return;
      setData(null);
      setError(cause instanceof Error ? cause.message : "Unable to retrieve Hindsight memories.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadMemories(query, controller.signal);
    return () => controller.abort();
  }, [loadMemories, query, refreshKey]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuery(searchInput.trim());
  }

  const isMock = data?.isMock || data?.source === "HINDSIGHT_MOCK_TRANSPORT";

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 lg:p-6">
      <PageHeader
        title="Hindsight memory explorer"
        subtitle="Search the configured project memory bank. Retrieved history is context for assessment, not proof of current deployment state."
        badge={
          <span className="rounded-full border border-surface-border bg-surface px-2.5 py-1 font-mono text-[10px] font-semibold uppercase text-text-secondary">
            {data ? `${data.total} recalled` : "Live recall"}
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
        title="Why Engineering Post-Mortems Belong in Vector Memory"
        analogy="Think of a team's Slack or Notion wiki as an attic full of old boxes. When an outage happens, someone wrote a post-mortem document, but 6 months later nobody searches for it before deploying. Vector memory is like having an archivist who reads every single pull request diff and automatically hands you the exact post-mortem box before you push to prod."
        explanation="ReleaseTrace integrates with Hindsight Cloud. Each engineering incident, root cause, and verified mitigation is embedded into multi-dimensional vector space. When a new pull request touches database tables, queries, or configuration, Hindsight computes semantic similarity to retrieve relevant historical precedents instantly."
        whyItMatters="Most high-severity outages aren't brand-new bugs; they are repeats of past mistakes under slightly different commit messages. Persistent memory turns past pain into permanent institutional immunity."
        keyTerms={["Vector Embeddings", "Semantic Recall", "Root Cause & Mitigation", "Provenance & Signoff"]}
        suggestedAction={{
          label: "Learn vector memory in glossary",
          onClick: () => openGlossary("vector-memory"),
        }}
      />

      <div className={`rounded-lg border p-3 text-xs leading-relaxed ${isMock ? "border-amber-200 bg-amber-50 text-amber-900" : "border-sky-200 bg-sky-50 text-sky-900"}`}>
        {isMock
          ? "Hindsight is running in mock transport mode. These results are not evidence of persistence in Hindsight Cloud."
          : "Recall is served by the configured Hindsight provider. Similarity scores rank retrieval relevance; an engineer must still verify incident facts before retention."}
      </div>

      <div className="space-y-3">
        <form onSubmit={handleSearch} className="flex flex-col gap-2 rounded-xl border border-surface-border bg-surface p-3 shadow-panel-subtle sm:flex-row">
          <label className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search incidents, symptoms, migrations, database failures…"
              className="min-h-11 w-full rounded-lg border border-surface-border bg-surface-subtle pl-9 pr-3 text-xs text-text-primary outline-none transition placeholder:text-text-muted focus:border-signal"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-signal px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            <BrainCircuit className="h-3.5 w-3.5" />
            Recall memories
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-1.5 px-1 text-xs">
          <span className="font-mono text-[11px] text-text-muted">Student quick searches:</span>
          {[
            "Postgres table lock timeout",
            "Connection pool saturation",
            "Unindexed foreign key migration",
            "Prisma ALTER TABLE exclusive lock",
          ].map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => {
                setSearchInput(sample);
                setQuery(sample);
              }}
              className="rounded-full border border-surface-border bg-surface px-2.5 py-1 font-mono text-[11px] text-text-secondary transition hover:border-signal/50 hover:bg-brand-subtle hover:text-signal"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          <WifiOff className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Hindsight recall unavailable</p>
            <p className="mt-0.5 text-xs">{error}</p>
          </div>
        </div>
      )}

      {data && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Database className="h-3 w-3" />
            Bank <code className="font-mono text-text-secondary">{data.bankId}</code>
          </span>
          <span className="font-mono uppercase">{data.source.replaceAll("_", " ")}</span>
        </div>
      )}

      {loading && !data ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-36 animate-pulse rounded-xl border border-surface-border bg-surface-subtle" />
          ))}
        </div>
      ) : data?.memories.length ? (
        <div className="space-y-3">
          {data.memories.map((memory, index) => {
            const id = memory.id || memory.memoryId || `retrieved-${index}`;
            const title =
              metadataValue(memory.metadata, ["title", "incidentTitle", "name"]) ||
              `Retrieved memory ${index + 1}`;
            const score = scoreLabel(memory.scores?.final);
            const semantic = scoreLabel(memory.scores?.semantic);

            return (
              <article key={id} className="rounded-xl border border-surface-border bg-surface p-4 shadow-panel-subtle">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="break-words text-sm font-bold text-text-primary">{title}</h2>
                    <p className="mt-1 break-all font-mono text-[10px] text-text-muted">{id}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {score && (
                      <span className="rounded-full border border-signal/20 bg-brand-subtle px-2.5 py-1 font-mono text-[10px] font-semibold text-signal">
                        Relevance {score}
                      </span>
                    )}
                    {semantic && (
                      <span className="rounded-full border border-surface-border bg-surface-subtle px-2.5 py-1 font-mono text-[10px] text-text-secondary">
                        Semantic {semantic}
                      </span>
                    )}
                  </div>
                </div>

                <p className="mt-3 whitespace-pre-wrap break-words text-xs leading-relaxed text-text-secondary">
                  {memoryBody(memory)}
                </p>
                {memory.context && memory.text && (
                  <p className="mt-3 whitespace-pre-wrap break-words rounded-lg bg-surface-subtle p-3 text-xs leading-relaxed text-text-muted">
                    {memory.context}
                  </p>
                )}
                {memory.tags && memory.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {memory.tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 rounded-full border border-surface-border bg-surface-subtle px-2 py-1 font-mono text-[10px] text-text-secondary">
                        <Tag className="h-2.5 w-2.5" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex items-center gap-1.5 border-t border-surface-border pt-3 text-[10px] text-text-muted">
                  <CheckCircle2 className="h-3 w-3" />
                  Retrieved from the project bank · not independently re-verified by this screen
                </div>
              </article>
            );
          })}
        </div>
      ) : data ? (
        <div className="rounded-xl border border-surface-border bg-surface px-4 py-14 text-center shadow-panel-subtle">
          <BrainCircuit className="mx-auto h-8 w-8 text-text-muted" />
          <h2 className="mt-3 text-sm font-semibold text-text-primary">No matching memories</h2>
          <p className="mt-1 text-xs text-text-muted">
            Try a broader query or send verified deployment resolutions through the engineer-authorized retention workflow.
          </p>
        </div>
      ) : !error ? (
        <div className="rounded-xl border border-surface-border bg-surface p-8 text-center">
          <AlertCircle className="mx-auto h-7 w-7 text-text-muted" />
          <p className="mt-2 text-sm text-text-secondary">Waiting for Hindsight results.</p>
        </div>
      ) : null}
    </div>
  );
}
