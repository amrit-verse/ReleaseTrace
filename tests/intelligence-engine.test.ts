import { describe, it, expect, beforeEach } from 'vitest';
import { ReleaseTraceIntelligenceEngine } from '../src/intelligence/engine/intelligence-engine';
import { HindsightAdapter } from '../src/intelligence/hindsight/adapter';
import { GroqAdapter } from '../src/intelligence/llm/groq-adapter';
import type { DeploymentContext, VerifiedEngineeringMemory } from '../src/intelligence/types';

describe('ReleaseTrace Intelligence Engine Integration', () => {
  let engine: ReleaseTraceIntelligenceEngine;
  let hindsightAdapter: HindsightAdapter;

  const projectId = 'auth-service';
  const service = 'auth-service';

  const baseDeployment: DeploymentContext = {
    deploymentId: 'dep-auth-100',
    projectId,
    service,
    timestamp: '2026-11-06T10:00:00Z',
    commitHash: 'commit-auth-1',
    branch: 'main',
    gitDiffSummary: {
      filesChanged: ['src/db/migrations/001_session.sql'],
      additions: 20,
      deletions: 2,
      hasDatabaseMigrations: true,
      migrationDetails: 'ALTER TABLE sessions ADD COLUMN last_active_at TIMESTAMP;',
    },
    environment: {
      runtime: 'nodejs@20.11.0',
      database: { type: 'postgresql', version: '14.2', poolSize: 15 },
      infrastructure: { provider: 'aws', region: 'us-east-1', replicas: 3 },
      featureFlags: {},
      envVariables: {},
      dependencies: {},
    },
    targetEnvironment: 'production',
  };

  beforeEach(() => {
    HindsightAdapter.resetInstance();
    hindsightAdapter = HindsightAdapter.getInstance({ useMockTransport: true });
    hindsightAdapter.clearMockBank(hindsightAdapter.getRawClient() ? `rt-${projectId}` : projectId);

    engine = new ReleaseTraceIntelligenceEngine({
      hindsightAdapter,
      groqAdapter: new GroqAdapter({ useMockTransport: true }),
      relevanceThreshold: 0.65,
    });
  });

  it('abstains from memory when bank is empty, relying solely on current evidence & rules', async () => {
    const assessment = await engine.assessDeployment(baseDeployment);

    expect(assessment.memoryAssessmentState).toBe('ABSTAINED_NO_RELEVANT_MEMORIES');
    expect(assessment.recalledMemories.length).toBe(0);
    expect(assessment.abstentionReason).toContain('Empty memory bank');
    expect(assessment.currentEvidenceSummary.gitChanges).toContain('1 files changed');
    expect(assessment.provenance.memoryCountConsulted).toBe(0);
  });

  it('retains verified experience, recalls it on similar deployment, and enriches assessment', async () => {
    // 1. Initial assessment on empty bank
    const initialAssessment = await engine.assessDeployment(baseDeployment);
    expect(initialAssessment.recalledMemories.length).toBe(0);

    // 2. Retain verified incident
    const memory: VerifiedEngineeringMemory = {
      id: 'case-auth-pool-01',
      projectId,
      deploymentId: baseDeployment.deploymentId,
      service,
      createdAt: '2026-11-06T11:00:00Z',
      environment: { ...baseDeployment.environment },
      failureContext: {
        failureType: 'DB_CONNECTION_POOL_EXHAUSTION',
        symptoms: ['Pool saturation on ALTER TABLE sessions'],
        errorSignatures: ['timeout exceeded when trying to connect to database'],
        logsSample: [],
      },
      confirmedRootCause: 'Exclusive table lock on active sessions table locked all worker connections.',
      verifiedMitigation: 'Add lock_timeout = 2s and deploy with PgBouncer connection pooler.',
      outcome: 'resolved',
      confirmation: {
        confirmedBy: 'marcus@corp.com',
        confirmedAt: '2026-11-06T12:00:00Z',
        isConfirmed: true,
        confirmationMethod: 'manual_investigation',
        verificationEvidence: 'Forensic pg_stat_activity query log confirmed lock pileup.',
      },
      tags: ['sessions', 'pool-exhaustion'],
    };

    await engine.getRetentionWorkflow().retainVerifiedExperience(memory);

    // 3. Similar subsequent deployment
    const subsequentDeployment: DeploymentContext = {
      ...baseDeployment,
      deploymentId: 'dep-auth-101',
      gitDiffSummary: {
        filesChanged: ['src/db/migrations/002_session_ip.sql'],
        additions: 15,
        deletions: 1,
        hasDatabaseMigrations: true,
        migrationDetails: 'ALTER TABLE sessions ADD COLUMN client_ip VARCHAR(45);',
      },
    };

    const enrichedAssessment = await engine.assessDeployment(subsequentDeployment);

    expect(enrichedAssessment.memoryAssessmentState).toBe('ACCUMULATED_EXPERIENCE');
    expect(enrichedAssessment.recalledMemories.length).toBe(1);
    expect(enrichedAssessment.recalledMemories[0].memoryId).toBe('case-auth-pool-01');
    expect(enrichedAssessment.recalledMemories[0].confirmedBy).toBe('marcus@corp.com');

    // Recommendations cite verified memory with conditions
    const memoryRec = enrichedAssessment.recommendations.find(r => r.source === 'VERIFIED_MEMORY');
    expect(memoryRec).toBeDefined();
    expect(memoryRec?.memoryReference?.memoryId).toBe('case-auth-pool-01');
    expect(memoryRec?.conditionNotice).toContain('postgresql');
  });

  it('detects and explains environment mismatch when target conditions differ from memory', async () => {
    // Retain incident on postgresql v14, pool size 10
    const memory: VerifiedEngineeringMemory = {
      id: 'case-env-diff-01',
      projectId,
      deploymentId: 'dep-old',
      service,
      createdAt: '2026-11-06T10:00:00Z',
      environment: {
        ...baseDeployment.environment,
        database: { type: 'postgresql', version: '14.2', poolSize: 10 },
      },
      failureContext: {
        failureType: 'DB_CONNECTION_POOL_EXHAUSTION',
        symptoms: ['Pool saturation on migration'],
        errorSignatures: ['timeout exceeded when trying to connect to database'],
        logsSample: [],
      },
      confirmedRootCause: 'Pool size 10 exhausted during migration.',
      verifiedMitigation: 'Increase pool size to 50.',
      outcome: 'resolved',
      confirmation: {
        confirmedBy: 'marcus@corp.com',
        confirmedAt: '2026-11-06T11:00:00Z',
        isConfirmed: true,
        confirmationMethod: 'manual_investigation',
        verificationEvidence: 'Checked pool limits.',
      },
      tags: ['pool'],
    };

    await engine.getRetentionWorkflow().retainVerifiedExperience(memory);

    // Current deployment targets postgresql v16 with pool size 50
    const newDeployment: DeploymentContext = {
      ...baseDeployment,
      deploymentId: 'dep-new',
      environment: {
        ...baseDeployment.environment,
        database: { type: 'postgresql', version: '16.0', poolSize: 50 },
      },
    };

    const assessment = await engine.assessDeployment(newDeployment);
    expect(assessment.environmentComparison).toBeDefined();
    expect(assessment.environmentComparison?.differences.some(d => d.parameter === 'database.poolSize')).toBe(true);
    expect(assessment.environmentComparison?.explanation).toContain('database.poolSize');
  });
});
