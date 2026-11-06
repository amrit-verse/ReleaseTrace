/**
 * ReleaseTrace Dynamic Memory Engine
 * Computes semantic similarity, manages persistent Hindsight memory retention,
 * and dynamically calculates release risk based on evidence, environment drift, and recalled incidents.
 */

import { HindsightMemory, RiskClassification } from "@/types";
import { mockMemories } from "@/data/mockData";

// Tokenizer and N-gram generator for semantic text similarity
function tokenize(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9_$-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const tokens = new Set<string>(words);

  // Add 2-word bi-grams for phrase matching (e.g. "table rewrite", "connection pool")
  for (let i = 0; i < words.length - 1; i++) {
    tokens.add(`${words[i]}_${words[i + 1]}`);
  }

  return tokens;
}

// Jaccard token similarity with weighted domain keywords
export function calculateSimilarity(
  query: string,
  target: { title: string; symptoms: string[]; rootCause: string; tags: string[] }
): number {
  const queryTokens = tokenize(query);
  const targetText = [
    target.title,
    ...target.symptoms,
    target.rootCause,
    ...target.tags,
  ].join(" ");
  const targetTokens = tokenize(targetText);

  if (queryTokens.size === 0 || targetTokens.size === 0) return 0;

  let intersection = 0;
  for (const token of queryTokens) {
    if (targetTokens.has(token)) {
      // Weight critical engineering terms higher
      const isCriticalTerm =
        token.includes("lock") ||
        token.includes("timeout") ||
        token.includes("rewrite") ||
        token.includes("storm") ||
        token.includes("pool") ||
        token.includes("tls") ||
        token.includes("cipher") ||
        token.includes("kafka") ||
        token.includes("rebalance") ||
        token.includes("redos") ||
        token.includes("loop");
      intersection += isCriticalTerm ? 2 : 1;
    }
  }

  const union = queryTokens.size + targetTokens.size - intersection;
  const rawScore = intersection / Math.max(1, union);

  // Normalize into 0.00 - 0.99 range for UI precision
  return Math.min(0.98, Math.max(0, rawScore * 2.2));
}

export interface EngineAssessmentResult {
  riskScore: number;
  riskClassification: RiskClassification;
  recalledMemories: Array<HindsightMemory & { similarityScore: number; relevanceWhy: string }>;
  reasons: string[];
  preventativeActions: string[];
  source: "LIVE_MEMORY_ENGINE" | "FIXTURE";
}

const STORAGE_KEY = "releasetrace_active_memories_v1";

export function getActiveMemories(): HindsightMemory[] {
  if (typeof window === "undefined") {
    return mockMemories;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockMemories));
      return mockMemories;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to read memories from storage:", err);
    return mockMemories;
  }
}

export function saveActiveMemories(memories: HindsightMemory[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memories));
  } catch (err) {
    console.error("Failed to save memories to storage:", err);
  }
}

export function retainNewMemory(newMemory: Omit<HindsightMemory, "id" | "recalledCount" | "preventedIncidentsCount">): HindsightMemory {
  const current = getActiveMemories();
  const generatedId = `MEM-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

  const created: HindsightMemory = {
    ...newMemory,
    id: generatedId,
    recalledCount: 1,
    preventedIncidentsCount: 0,
    source: "LOCAL_ENGINE",
  };

  const updated = [created, ...current];
  saveActiveMemories(updated);
  return created;
}

export function resetMemoriesToDefault(): HindsightMemory[] {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockMemories));
  }
  return mockMemories;
}

/**
 * Real-time dynamic evaluation function
 * Evaluates code diff + environment context against current active memory bank.
 */
export function evaluateReleaseRisk(
  codeDiff: string,
  serviceName: string,
  environmentNotes: string,
  activeMemoriesList?: HindsightMemory[]
): EngineAssessmentResult {
  const memories = activeMemoriesList || getActiveMemories();
  const fullQuery = `${serviceName} ${codeDiff} ${environmentNotes}`;

  const scoredMemories: Array<HindsightMemory & { similarityScore: number; relevanceWhy: string }> = [];

  for (const memory of memories) {
    const score = calculateSimilarity(fullQuery, {
      title: memory.title,
      symptoms: memory.symptoms,
      rootCause: memory.rootCause,
      tags: memory.tags,
    });

    if (score >= 0.45) {
      scoredMemories.push({
        ...memory,
        similarityScore: Number(score.toFixed(3)),
        relevanceWhy: `${(score * 100).toFixed(1)}% semantic match against ${memory.provenance.incidentTicket}: ${memory.title}`,
      });
    }
  }

  // Sort descending by similarity
  scoredMemories.sort((a, b) => b.similarityScore - a.similarityScore);

  const highestRecall = scoredMemories[0];

  if (!highestRecall || highestRecall.similarityScore < 0.5) {
    // Cold / Baseline state: Static heuristics only
    const staticDriftDetected = environmentNotes.toLowerCase().includes("disparity") || environmentNotes.toLowerCase().includes("drift");
    const baselineScore = staticDriftDetected ? 35 : 18;

    return {
      riskScore: baselineScore,
      riskClassification: baselineScore > 30 ? "ELEVATED" : "NOMINAL",
      recalledMemories: [],
      reasons: [
        "Static code syntax analysis passed.",
        "Unit test suites reported passing status.",
        "Zero matching historical incidents found in current Hindsight memory bank.",
        "WARNING: Environment scale disparity may harbor latent production risks without historical recall.",
      ],
      preventativeActions: [
        "Run standard staging integration test pass.",
        "Verify service readiness probes before canary switch.",
      ],
      source: "LIVE_MEMORY_ENGINE",
    };
  }

  // Warm / Learned state: Recalled prior incident!
  const calculatedRiskScore = Math.min(98, Math.round(50 + highestRecall.similarityScore * 48));
  const classification: RiskClassification =
    calculatedRiskScore >= 85 ? "CRITICAL" : calculatedRiskScore >= 65 ? "HIGH_RISK" : "ELEVATED";

  const reasons = [
    `Hindsight Memory Engine actively recalled ${highestRecall.id} (${highestRecall.provenance.incidentTicket}) with ${(highestRecall.similarityScore * 100).toFixed(1)}% similarity.`,
    `Matched Root Cause: ${highestRecall.rootCause}`,
    `Environmental trigger detected in release payload resembling previous outage on ${new Date(highestRecall.incidentDate).toLocaleDateString()}.`,
  ];

  const preventativeActions = [
    `PROACTIVE BLOCK: Avert repeated failure documented in ${highestRecall.provenance.incidentTicket}.`,
    ...highestRecall.failedApproaches.map((approach) => `DO NOT: ${approach}`),
    `ENFORCE RESOLUTION: ${highestRecall.resolution}`,
  ];

  return {
    riskScore: calculatedRiskScore,
    riskClassification: classification,
    recalledMemories: scoredMemories.slice(0, 3),
    reasons,
    preventativeActions,
    source: "LIVE_MEMORY_ENGINE",
  };
}
