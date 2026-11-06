/**
 * ReleaseTrace Reproducible Experience Demo Workflow
 * 
 * Demonstrates the 8-stage evolutionary sequence:
 * A. Empty memory bank.
 * B. First deployment failure.
 * C. Engineer confirms root cause.
 * D. Retain verified memory in Hindsight.
 * E. Similar subsequent deployment.
 * F. Recall previous experience.
 * G. Generate a visibly different recommendation.
 * H. Verify the recommendation against current evidence.
 */

import { ReleaseTraceIntelligenceEngine } from '../engine/intelligence-engine';
import { HindsightAdapter } from '../hindsight/adapter';
import { GroqAdapter } from '../llm/groq-adapter';
import type {
  DeploymentContext,
  VerifiedEngineeringMemory,
  ReleaseAssessment,
} from '../types';

export interface DemoExecutionLog {
  stage: string;
  description: string;
  assessmentState?: string;
  overallRisk?: string;
  recommendationsCount?: number;
  memoryCitationsCount?: number;
  topRecommendation?: string;
  details?: unknown;
}

export interface DemoWorkflowResult {
  logs: DemoExecutionLog[];
  assessmentA: ReleaseAssessment;
  assessmentG: ReleaseAssessment;
  verifiedMemoryRetained: VerifiedEngineeringMemory;
  visiblyDifferentProof: {
    recommendationDifference: {
      initialA: string;
      subsequentG: string;
    };
    memoryCitationsDifference: {
      initialCount: number;
      subsequentCount: number;
    };
    conditionsAccompanyingRecommendation: string;
  };
}

export async function runReleaseTraceDemoWorkflow(options: {
  useMockTransport?: boolean;
} = {}): Promise<DemoWorkflowResult> {
  const logs: DemoExecutionLog[] = [];

  // Initialize adapters and engine
  const hindsightAdapter = HindsightAdapter.getInstance({
    useMockTransport: options.useMockTransport ?? true,
  });

  const groqAdapter = new GroqAdapter({
    useMockTransport: options.useMockTransport ?? true,
  });

  const engine = new ReleaseTraceIntelligenceEngine({
    hindsightAdapter,
    groqAdapter,
    relevanceThreshold: 0.65,
  });

  const projectId = 'payment-gateway';
  const service = 'payment-service';

  // =========================================================================
  // STAGE A: Empty Memory Bank
  // =========================================================================
  // Ensure the project bank is clean
  const bankId = engine.getBankManager().getProjectBankId(projectId);
  hindsightAdapter.clearMockBank(bankId);

  const deploymentA: DeploymentContext = {
    deploymentId: 'deploy-v1-0-1',
    projectId,
    service,
    timestamp: '2026-11-01T10:00:00Z',
    commitHash: 'a1b2c3d',
    branch: 'main',
    gitDiffSummary: {
      filesChanged: ['src/db/migrations/001_add_status.sql', 'src/models/transaction.ts'],
      additions: 45,
      deletions: 2,
      hasDatabaseMigrations: true,
      migrationDetails: 'ALTER TABLE transactions ADD COLUMN status VARCHAR(32);',
    },
    environment: {
      runtime: 'nodejs@20.11.0',
      database: {
        type: 'postgresql',
        version: '14.2',
        poolSize: 15,
        maxIdleTimeoutMs: 30000,
      },
      infrastructure: {
        provider: 'aws',
        region: 'us-east-1',
        replicas: 4,
      },
      featureFlags: { enableFastCheckout: true },
      envVariables: { NODE_ENV: 'production' },
      dependencies: { pg: '8.11.0' },
    },
    targetEnvironment: 'production',
  };

  const assessmentA = await engine.assessDeployment(deploymentA);

  logs.push({
    stage: 'A. Empty memory bank',
    description: 'Initial deployment with no historical memory records.',
    assessmentState: assessmentA.memoryAssessmentState,
    overallRisk: assessmentA.overallRisk,
    recommendationsCount: assessmentA.recommendations.length,
    memoryCitationsCount: assessmentA.recalledMemories.length,
    topRecommendation: assessmentA.recommendations[0]?.action,
    details: {
      abstentionReason: assessmentA.abstentionReason,
    },
  });

  // =========================================================================
  // STAGE B: First Deployment Failure
  // =========================================================================
  // In production, deploymentA triggers connection starvation during peak traffic
  const failureIncident = {
    deploymentId: deploymentA.deploymentId,
    failedAt: '2026-11-01T10:14:22Z',
    failureType: 'DB_CONNECTION_POOL_EXHAUSTION',
    errorSignatures: [
      'FATAL: remaining connection slots are reserved for non-replication superuser connections',
      'error: timeout exceeded when trying to connect to database',
    ],
    logsSample: [
      '[10:14:18] transactions: AccessExclusiveLock acquired for ALTER TABLE transactions',
      '[10:14:20] API worker pool exhausted: 15/15 connections saturated across 4 replicas',
      '[10:14:22] HTTP 504 Gateway Timeout on /v1/charge',
    ],
  };

  logs.push({
    stage: 'B. First deployment failure',
    description: 'Deployment failed in production due to DB connection pool exhaustion under un-timed table lock.',
    details: failureIncident,
  });

  // =========================================================================
  // STAGE C: Engineer Confirms Root Cause
  // =========================================================================
  // Engineer investigates pg_stat_activity and confirms the verified root cause
  const confirmedMemoryInput: VerifiedEngineeringMemory = {
    id: 'case-pay-pool-001',
    projectId,
    deploymentId: deploymentA.deploymentId,
    service,
    createdAt: '2026-11-01T12:30:00Z',
    environment: deploymentA.environment,
    failureContext: {
      failureType: failureIncident.failureType,
      symptoms: [
        'All 4 replicas saturated connection pools within 12 seconds of migration execution',
        'API latency spiked from 45ms to > 30000ms',
      ],
      errorSignatures: failureIncident.errorSignatures,
      logsSample: failureIncident.logsSample,
    },
    confirmedRootCause:
      'Unbounded AccessExclusiveLock during ALTER TABLE queued 60 concurrent worker connections, exhausting postgres max_connections on pool size 15.',
    verifiedMitigation:
      'Add `SET lock_timeout = "2s";` before DDL statements and reduce maxIdleTimeoutMs to 5000ms with PgBouncer connection pooling.',
    outcome: 'resolved',
    confirmation: {
      confirmedBy: 'sarah.chen@engineering.corp',
      confirmedAt: '2026-11-01T13:00:00Z',
      isConfirmed: true,
      confirmationMethod: 'manual_investigation',
      verificationEvidence:
        'pg_stat_activity confirmed 60 sessions blocked on lock_mode ExclusiveLock during ALTER TABLE transactions statement.',
      notes: 'Verified in staging drill before hotfix release.',
    },
    tags: ['db:postgres', 'failure:connection_pool', 'table:transactions'],
  };

  logs.push({
    stage: 'C. Engineer confirms root cause',
    description: 'Human engineer confirmed verified root cause and forensic evidence. LLM guesses rejected.',
    details: {
      confirmedBy: confirmedMemoryInput.confirmation.confirmedBy,
      confirmedRootCause: confirmedMemoryInput.confirmedRootCause,
      verifiedMitigation: confirmedMemoryInput.verifiedMitigation,
    },
  });

  // =========================================================================
  // STAGE D: Retain Verified Memory in Hindsight
  // =========================================================================
  const retentionResult = await engine.getRetentionWorkflow().retainVerifiedExperience(confirmedMemoryInput);

  logs.push({
    stage: 'D. Retain verified memory in Hindsight',
    description: 'Stored verified engineering experience into Hindsight memory bank with idempotent document ID.',
    details: retentionResult,
  });

  // =========================================================================
  // STAGE E: Similar Subsequent Deployment
  // =========================================================================
  const deploymentE: DeploymentContext = {
    deploymentId: 'deploy-v1-0-2',
    projectId,
    service,
    timestamp: '2026-11-05T14:00:00Z',
    commitHash: 'e5f6g7h',
    branch: 'main',
    gitDiffSummary: {
      filesChanged: ['src/db/migrations/002_add_risk_score.sql', 'src/services/risk.ts'],
      additions: 52,
      deletions: 4,
      hasDatabaseMigrations: true,
      migrationDetails: 'ALTER TABLE transactions ADD COLUMN risk_score FLOAT;',
    },
    environment: {
      runtime: 'nodejs@20.11.0',
      database: {
        type: 'postgresql',
        version: '14.2',
        poolSize: 15,
        maxIdleTimeoutMs: 30000,
      },
      infrastructure: {
        provider: 'aws',
        region: 'us-east-1',
        replicas: 4,
      },
      featureFlags: { enableFastCheckout: true },
      envVariables: { NODE_ENV: 'production' },
      dependencies: { pg: '8.11.0' },
    },
    targetEnvironment: 'production',
  };

  logs.push({
    stage: 'E. Similar subsequent deployment',
    description: 'New deployment modifying the same transactions table with schema migration.',
    details: {
      deploymentId: deploymentE.deploymentId,
      migrationDetails: deploymentE.gitDiffSummary.migrationDetails,
    },
  });

  // =========================================================================
  // STAGE F & G: Recall Experience & Generate Visibly Different Recommendation
  // =========================================================================
  const assessmentG = await engine.assessDeployment(deploymentE);

  logs.push({
    stage: 'F. Recall previous experience',
    description: 'Hindsight recalled matching verified failure case-pay-pool-001.',
    details: {
      recalledCount: assessmentG.recalledMemories.length,
      topMemory: assessmentG.recalledMemories[0]?.memoryId,
      relevanceScore: assessmentG.recalledMemories[0]?.relevanceScore,
    },
  });

  logs.push({
    stage: 'G. Generate visibly different recommendation',
    description: 'Assessment output visibly transformed by historical memory precedent.',
    assessmentState: assessmentG.memoryAssessmentState,
    overallRisk: assessmentG.overallRisk,
    recommendationsCount: assessmentG.recommendations.length,
    memoryCitationsCount: assessmentG.recalledMemories.length,
    topRecommendation: assessmentG.recommendations[0]?.action,
    details: {
      citedConfirmedBy: assessmentG.recalledMemories[0]?.confirmedBy,
      conditionNotice: assessmentG.recommendations[0]?.conditionNotice,
    },
  });

  // =========================================================================
  // STAGE H: Verify Recommendation Against Current Evidence
  // =========================================================================
  const currentEvidenceVerification = {
    isRecommendationGroundTruthAligned: assessmentG.recommendations.some(r =>
      r.rationale.includes(confirmedMemoryInput.id) ||
      r.action.toLowerCase().includes('lock_timeout') ||
      r.action.toLowerCase().includes('mitigation')
    ),
    historicalConditionsAccompanied: Boolean(
      assessmentG.recommendations.some(r => r.conditionNotice && r.conditionNotice.includes('postgresql'))
    ),
    currentEvidenceDistinguishedFromHistorical: Boolean(
      assessmentG.currentEvidenceSummary.gitChanges &&
      assessmentG.recalledMemories.length > 0 &&
      assessmentG.currentEvidenceSummary.gitChanges !== assessmentG.recalledMemories[0].historicalConditions
    ),
  };

  logs.push({
    stage: 'H. Verify recommendation against current evidence',
    description: 'Confirmed recommendation accompanies exact historical conditions and checks against current diff.',
    details: currentEvidenceVerification,
  });

  return {
    logs,
    assessmentA,
    assessmentG,
    verifiedMemoryRetained: confirmedMemoryInput,
    visiblyDifferentProof: {
      recommendationDifference: {
        initialA: assessmentA.recommendations[0]?.action || 'None',
        subsequentG: assessmentG.recommendations[0]?.action || 'None',
      },
      memoryCitationsDifference: {
        initialCount: assessmentA.recalledMemories.length,
        subsequentCount: assessmentG.recalledMemories.length,
      },
      conditionsAccompanyingRecommendation:
        assessmentG.recommendations.find(r => r.source === 'VERIFIED_MEMORY')?.conditionNotice ||
        assessmentG.recalledMemories[0]?.historicalConditions || '',
    },
  };
}
