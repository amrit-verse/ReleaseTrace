import { describe, it, expect, beforeEach } from 'vitest';
import { HindsightAdapter } from '../src/intelligence/hindsight/adapter';
import { ProjectMemoryBankManager } from '../src/intelligence/hindsight/bank-manager';
import { ExperienceRetentionWorkflow } from '../src/intelligence/hindsight/retention';
import { HistoricalRecallWorkflow } from '../src/intelligence/hindsight/recall';
import type { VerifiedEngineeringMemory, DeploymentContext } from '../src/intelligence/types';

describe('Hindsight Adapter, Bank Manager, Retention & Recall', () => {
  let adapter: HindsightAdapter;
  let bankManager: ProjectMemoryBankManager;
  let retentionWorkflow: ExperienceRetentionWorkflow;
  let recallWorkflow: HistoricalRecallWorkflow;

  const projectId = 'catalog-service';
  const validMemory: VerifiedEngineeringMemory = {
    id: 'case-cat-001',
    projectId,
    deploymentId: 'dep-c-1',
    service: 'catalog-service',
    createdAt: '2026-11-02T10:00:00Z',
    environment: {
      runtime: 'nodejs@20.11.0',
      database: { type: 'postgresql', version: '15.1', poolSize: 10 },
      infrastructure: { provider: 'aws', region: 'us-east-1', replicas: 2 },
      featureFlags: {},
      envVariables: {},
      dependencies: {},
    },
    failureContext: {
      failureType: 'CATALOG_INDEX_DEADLOCK',
      symptoms: ['Concurrent category reindexing locked table'],
      errorSignatures: ['deadlock detected'],
      logsSample: [],
    },
    confirmedRootCause: 'Concurrent GIN index update deadlocked with catalog update.',
    verifiedMitigation: 'Schedule GIN reindex during maintenance window with lock_timeout.',
    outcome: 'resolved',
    confirmation: {
      confirmedBy: 'dba@corp.com',
      confirmedAt: '2026-11-02T11:00:00Z',
      isConfirmed: true,
      confirmationMethod: 'manual_investigation',
      verificationEvidence: 'Postgres pg_locks and pg_stat_activity logs.',
    },
    tags: ['reindex', 'deadlock'],
  };

  beforeEach(() => {
    HindsightAdapter.resetInstance();
    adapter = HindsightAdapter.getInstance({ useMockTransport: true });
    bankManager = new ProjectMemoryBankManager(adapter);
    retentionWorkflow = new ExperienceRetentionWorkflow(adapter, bankManager);
    recallWorkflow = new HistoricalRecallWorkflow(adapter, bankManager);
  });

  it('produces stable normalized bank ID per project', () => {
    expect(bankManager.getProjectBankId('My Project / v2!')).toBe('rt-my-project-v2');
    expect(bankManager.getProjectBankId('catalog-service')).toBe('rt-catalog-service');
  });

  it('creates and reads back project bank configuration', async () => {
    const bankId = await bankManager.ensureProjectBank(projectId);
    expect(bankId).toBe('rt-catalog-service');

    const config = await bankManager.getBankConfiguration(projectId);
    expect(config.bank_id).toBe('rt-catalog-service');
  });

  it('retains verified memory with idempotent document ID safely', async () => {
    const result1 = await retentionWorkflow.retainVerifiedExperience(validMemory);
    expect(result1.success).toBe(true);
    expect(result1.documentId).toBe('case-catalog-service-dep-c-1-case-cat-001');

    // Repeated retention with same ID must be idempotent (no error, safe update)
    const result2 = await retentionWorkflow.retainVerifiedExperience(validMemory);
    expect(result2.success).toBe(true);
    expect(result2.documentId).toBe(result1.documentId);
  });

  it('recalls historical experience matching deployment context', async () => {
    await retentionWorkflow.retainVerifiedExperience(validMemory);

    const targetDeployment: DeploymentContext = {
      deploymentId: 'dep-c-2',
      projectId,
      service: 'catalog-service',
      timestamp: '2026-11-06T10:00:00Z',
      commitHash: 'commit-cat-2',
      branch: 'main',
      gitDiffSummary: {
        filesChanged: ['migrations/002_reindex.sql'],
        additions: 5,
        deletions: 1,
        hasDatabaseMigrations: true,
        migrationDetails: 'REINDEX TABLE CONCURRENTLY catalog_items;',
      },
      environment: { ...validMemory.environment },
      targetEnvironment: 'production',
    };

    const recalled = await recallWorkflow.recallHistoricalFailures(targetDeployment);
    expect(recalled.length).toBeGreaterThanOrEqual(1);
    expect(recalled[0].memory.id).toBe('case-cat-001');
    expect(recalled[0].memory.confirmation.confirmedBy).toBe('dba@corp.com');
  });
});
