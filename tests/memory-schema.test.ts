import { describe, it, expect } from 'vitest';
import {
  validateVerifiedMemory,
  assertEngineerConfirmation,
  serializeMemoryToText,
  UnconfirmedMemoryError,
  InvalidMemorySchemaError,
} from '../src/intelligence/memory/schema';
import type { VerifiedEngineeringMemory } from '../src/intelligence/types';

describe('Verified Engineering Memory Schema & Invariants', () => {
  const validMemory: VerifiedEngineeringMemory = {
    id: 'case-test-001',
    projectId: 'billing-engine',
    deploymentId: 'dep-9988',
    service: 'invoice-service',
    createdAt: '2026-11-01T12:00:00Z',
    environment: {
      runtime: 'nodejs@20.11.0',
      database: {
        type: 'postgresql',
        version: '15.1',
        poolSize: 20,
        maxIdleTimeoutMs: 10000,
      },
      infrastructure: {
        provider: 'aws',
        region: 'us-west-2',
        replicas: 3,
      },
      featureFlags: { enableV2Invoicing: true },
      envVariables: { NODE_ENV: 'production' },
      dependencies: { pg: '8.11.0' },
    },
    failureContext: {
      failureType: 'CONNECTION_POOL_EXHAUSTION',
      symptoms: ['Connection pool saturated during bulk invoice generation'],
      errorSignatures: ['timeout exceeded when trying to connect'],
      logsSample: ['Error: connection timeout'],
    },
    confirmedRootCause: 'Batch invoice generator opened 50 concurrent transactions without connection pooling.',
    verifiedMitigation: 'Limit batch concurrency to 5 and implement connection queue with 2s timeout.',
    outcome: 'resolved',
    confirmation: {
      confirmedBy: 'alex.dev@corp.internal',
      confirmedAt: '2026-11-01T14:30:00Z',
      isConfirmed: true,
      confirmationMethod: 'manual_investigation',
      verificationEvidence: 'Examined pg_stat_activity showing 20 connections held in active transaction for > 30s.',
      notes: 'Hotfixed in patch 1.4.1',
    },
    tags: ['invoice', 'pool-exhaustion'],
  };

  it('validates a well-formed verified engineering memory', () => {
    const validated = validateVerifiedMemory(validMemory);
    expect(validated.id).toBe('case-test-001');
    expect(validated.confirmation.isConfirmed).toBe(true);
    expect(validated.confirmation.confirmedBy).toBe('alex.dev@corp.internal');
  });

  it('strictly rejects memories missing explicit engineer confirmation', () => {
    const unconfirmed = {
      ...validMemory,
      confirmation: {
        ...validMemory.confirmation,
        isConfirmed: false, // Invalid!
      },
    };

    expect(() => validateVerifiedMemory(unconfirmed)).toThrow(InvalidMemorySchemaError);
  });

  it('rejects an LLM hypothesis via assertEngineerConfirmation', () => {
    expect(() =>
      assertEngineerConfirmation({
        isHypothesis: true,
        confirmation: {
          isConfirmed: true,
          confirmedBy: 'engineer@corp.com',
          verificationEvidence: 'Evidence here...',
        },
      })
    ).toThrow(UnconfirmedMemoryError);
  });

  it('rejects confirmation with insufficient verification evidence', () => {
    expect(() =>
      assertEngineerConfirmation({
        confirmation: {
          isConfirmed: true,
          confirmedBy: 'engineer@corp.com',
          verificationEvidence: 'too short', // < 10 chars
        },
      })
    ).toThrow(UnconfirmedMemoryError);
  });

  it('serializes memory to structured text containing ground truth and historical conditions', () => {
    const text = serializeMemoryToText(validMemory);
    expect(text).toContain('# VERIFIED ENGINEERING INCIDENT CASE: case-test-001');
    expect(text).toContain('CONFIRMED ROOT CAUSE');
    expect(text).toContain('alex.dev@corp.internal');
    expect(text).toContain('HISTORICAL CONDITIONS & ENVIRONMENT');
    expect(text).toContain('Runtime: nodejs@20.11.0');
    expect(text).toContain('Database: postgresql v15.1 (Pool Size: 20');
  });
});
