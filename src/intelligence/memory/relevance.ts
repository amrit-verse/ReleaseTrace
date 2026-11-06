/**
 * Memory Relevance Scoring & Abstention Engine
 * 
 * Enforces the core ReleaseTrace invariants:
 * 1. "If recall is weak, abstain rather than hallucinate."
 * 2. "Empty-memory abstention: Never fabricate past incidents when none exist."
 */

import type {
  VerifiedEngineeringMemory,
  DeploymentContext,
  EnvironmentComparisonResult,
  MemoryAssessmentState,
} from '../types';

export interface MemoryRelevanceInput {
  memory: VerifiedEngineeringMemory;
  hindsightScore: number; // 0.0 to 1.0 from Hindsight retrieval
  environmentComparison: EnvironmentComparisonResult;
  currentDeployment: DeploymentContext;
}

export interface ScoredMemory {
  memory: VerifiedEngineeringMemory;
  rawHindsightScore: number;
  environmentMatchScore: number;
  failureSignatureSimilarity: number;
  finalRelevanceScore: number;
  isRelevant: boolean;
  abstentionReason?: string;
}

export interface RelevanceEvaluationResult {
  state: MemoryAssessmentState;
  scoredMemories: ScoredMemory[];
  qualifiedMemories: ScoredMemory[];
  shouldAbstain: boolean;
  abstentionReason?: string;
}

export const DEFAULT_RELEVANCE_THRESHOLD = 0.65;

/**
 * Calculates domain-specific failure signature similarity.
 */
export function calculateSignatureSimilarity(
  memory: VerifiedEngineeringMemory,
  currentDeployment: DeploymentContext
): number {
  let score = 0.0;
  let checks = 0;

  // Check 1: Service match
  checks += 1;
  if (memory.service.toLowerCase() === currentDeployment.service.toLowerCase()) {
    score += 1.0;
  }

  // Check 2: Database migration involvement
  if (currentDeployment.gitDiffSummary.hasDatabaseMigrations) {
    checks += 1;
    const historicalWasDbRelated =
      memory.failureContext.failureType.toLowerCase().includes('db') ||
      memory.failureContext.failureType.toLowerCase().includes('database') ||
      memory.failureContext.failureType.toLowerCase().includes('pool') ||
      memory.failureContext.failureType.toLowerCase().includes('migration');

    if (historicalWasDbRelated) {
      score += 1.0;
    }
  }

  // Check 3: Error signatures / keywords in diffs
  const diffDetails = (currentDeployment.gitDiffSummary.migrationDetails || '').toLowerCase();
  const fileNames = currentDeployment.gitDiffSummary.filesChanged.join(' ').toLowerCase();

  let keywordMatches = 0;
  for (const sig of memory.failureContext.errorSignatures) {
    if (diffDetails.includes(sig.toLowerCase()) || fileNames.includes(sig.toLowerCase())) {
      keywordMatches++;
    }
  }

  if (memory.failureContext.errorSignatures.length > 0) {
    checks += 1;
    score += keywordMatches / memory.failureContext.errorSignatures.length;
  }

  return checks > 0 ? score / checks : 0.5;
}

/**
 * Computes the unified relevance score incorporating Hindsight vector/rerank score,
 * environment alignment, and failure signature similarity.
 */
export function evaluateMemoryRelevance(
  input: MemoryRelevanceInput,
  relevanceThreshold: number = DEFAULT_RELEVANCE_THRESHOLD
): ScoredMemory {
  const { memory, hindsightScore, environmentComparison, currentDeployment } = input;
  const signatureSim = calculateSignatureSimilarity(memory, currentDeployment);

  // Composite formula:
  // 40% Hindsight semantic relevance + 35% Signature similarity + 25% Environment match
  const finalRelevanceScore =
    hindsightScore * 0.40 +
    signatureSim * 0.35 +
    environmentComparison.matchScore * 0.25;

  const isRelevant = finalRelevanceScore >= relevanceThreshold;

  let abstentionReason: string | undefined;
  if (!isRelevant) {
    abstentionReason = `Score ${finalRelevanceScore.toFixed(2)} is below minimum relevance floor (${relevanceThreshold.toFixed(2)}).`;
  }

  return {
    memory,
    rawHindsightScore: hindsightScore,
    environmentMatchScore: environmentComparison.matchScore,
    failureSignatureSimilarity: signatureSim,
    finalRelevanceScore: Math.round(finalRelevanceScore * 100) / 100,
    isRelevant,
    abstentionReason,
  };
}

/**
 * Evaluates an entire collection of recalled memories against the deployment context,
 * deciding whether to abstain or incorporate historical experience.
 */
export function evaluateRecallRelevance(
  inputs: MemoryRelevanceInput[],
  threshold: number = DEFAULT_RELEVANCE_THRESHOLD
): RelevanceEvaluationResult {
  // Case 1: Empty Memory Bank -> Empty-Memory Abstention
  if (!inputs || inputs.length === 0) {
    return {
      state: 'ABSTAINED_NO_RELEVANT_MEMORIES',
      scoredMemories: [],
      qualifiedMemories: [],
      shouldAbstain: true,
      abstentionReason: 'Empty memory bank: No historical deployment failure experiences found for this project.',
    };
  }

  const scoredMemories = inputs.map(input => evaluateMemoryRelevance(input, threshold));
  const qualifiedMemories = scoredMemories
    .filter(sm => sm.isRelevant)
    .sort((a, b) => b.finalRelevanceScore - a.finalRelevanceScore);

  // Case 2: Weak Recall -> Weak-Recall Abstention
  if (qualifiedMemories.length === 0) {
    const highestScore = scoredMemories.length > 0
      ? Math.max(...scoredMemories.map(m => m.finalRelevanceScore))
      : 0;

    return {
      state: 'ABSTAINED_WEAK_RECALL',
      scoredMemories,
      qualifiedMemories: [],
      shouldAbstain: true,
      abstentionReason: `Weak recall detected (highest score: ${highestScore.toFixed(2)} vs threshold: ${threshold.toFixed(2)}). Abstaining from historical analogy to avoid hallucinated precedents.`,
    };
  }

  // Case 3: Accumulated Experience
  return {
    state: 'ACCUMULATED_EXPERIENCE',
    scoredMemories,
    qualifiedMemories,
    shouldAbstain: false,
  };
}
