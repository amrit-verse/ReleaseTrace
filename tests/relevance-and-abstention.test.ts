import { describe, it, expect } from 'vitest';
import {
  evaluateRecallRelevance,
  evaluateMemoryRelevance,
  calculateSignatureSimilarity,
} from '../src/intelligence/memory/relevance';
import type { VerifiedEngineeringMemory, DeploymentContext, EnvironmentComparisonResult } from '../src/intelligence/types';

describe('Memory Relevance & Abstention Engine', () => {
  const mockMemory: VerifiedEngineeringMemory = {
    id: 'case-mem-001',
    projectId: 'order-system',
    deploymentId: 'dep-101',
    service: 'order-service',
    createdAt: '2026-11-01T10:00:00Z',
    environment: {
      runtime: 'nodejs@20.11.0',
      database: { type: 'postgresql', version: '14.2', poolSize: 10 },
      infrastructure: { provider: 'aws', region: 'us-east-1', replicas: 2 },
      featureFlags: {},
      envVariables: {},
      dependencies: {},
    },
    failureContext: {
      failureType: 'DB_CONNECTION_TIMEOUT',
      symptoms: ['Database pool exhaustion'],
      errorSignatures: ['timeout exceeded when trying to connect', 'remaining connection slots'],
      logsSample: [],
    },
    confirmedRootCause: 'Long table lock without timeout queued all connections.',
    verifiedMitigation: 'Add lock_timeout = 2s to migration.',
    outcome: 'resolved',
    confirmation: {
      confirmedBy: 'eng@corp.com',
      confirmedAt: '2026-11-01T11:00:00Z',
      isConfirmed: true,
      confirmationMethod: 'manual_investigation',
      verificationEvidence: 'Examined active locks in pg_stat_activity.',
    },
    tags: [],
  };

  const matchingDeployment: DeploymentContext = {
    deploymentId: 'dep-102',
    projectId: 'order-system',
    service: 'order-service',
    timestamp: '2026-11-05T12:00:00Z',
    commitHash: 'xyz123',
    branch: 'main',
    gitDiffSummary: {
      filesChanged: ['src/db/migrations/002.sql'],
      additions: 10,
      deletions: 1,
      hasDatabaseMigrations: true,
      migrationDetails: 'ALTER TABLE orders ADD COLUMN status VARCHAR(20);',
    },
    environment: { ...mockMemory.environment },
    targetEnvironment: 'production',
  };

  const perfectEnvComparison: EnvironmentComparisonResult = {
    isMatch: true,
    matchScore: 1.0,
    identicalKeys: ['runtime', 'database'],
    differingKeys: [],
    differences: [],
    explanation: 'Identical environments',
  };

  it('triggers Empty-Memory Abstention when no memories are recalled', () => {
    const result = evaluateRecallRelevance([]);
    expect(result.state).toBe('ABSTAINED_NO_RELEVANT_MEMORIES');
    expect(result.shouldAbstain).toBe(true);
    expect(result.qualifiedMemories.length).toBe(0);
    expect(result.abstentionReason).toContain('Empty memory bank');
  });

  it('triggers Weak-Recall Abstention when memory score is below threshold', () => {
    const scored = evaluateRecallRelevance(
      [
        {
          memory: {
            ...mockMemory,
            service: 'different-service',
            failureContext: {
              ...mockMemory.failureContext,
              failureType: 'UNRELATED_FRONTEND_CRASH',
              errorSignatures: ['css_not_found'],
            },
          },
          hindsightScore: 0.20,
          environmentComparison: {
            ...perfectEnvComparison,
            matchScore: 0.30,
            isMatch: false,
          },
          currentDeployment: matchingDeployment,
        },
      ],
      0.65
    );

    expect(scored.state).toBe('ABSTAINED_WEAK_RECALL');
    expect(scored.shouldAbstain).toBe(true);
    expect(scored.qualifiedMemories.length).toBe(0);
    expect(scored.abstentionReason).toContain('Weak recall detected');
  });

  it('qualifies high-relevance memories and sets ACCUMULATED_EXPERIENCE', () => {
    const scored = evaluateRecallRelevance(
      [
        {
          memory: mockMemory,
          hindsightScore: 0.85,
          environmentComparison: perfectEnvComparison,
          currentDeployment: matchingDeployment,
        },
      ],
      0.65
    );

    expect(scored.state).toBe('ACCUMULATED_EXPERIENCE');
    expect(scored.shouldAbstain).toBe(false);
    expect(scored.qualifiedMemories.length).toBe(1);
    expect(scored.qualifiedMemories[0].finalRelevanceScore).toBeGreaterThanOrEqual(0.65);
  });

  it('calculates higher signature similarity for matching service and migration', () => {
    const sim = calculateSignatureSimilarity(mockMemory, matchingDeployment);
    expect(sim).toBeGreaterThanOrEqual(0.6);
  });
});
