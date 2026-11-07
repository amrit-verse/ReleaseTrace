import { describe, it, expect } from 'vitest';
import { detectMemoryContradictions } from '../src/intelligence/memory/contradiction-detector';
import type { VerifiedEngineeringMemory } from '../src/intelligence/types';

describe('Memory Contradiction Detector', () => {
  const baseMemory: VerifiedEngineeringMemory = {
    id: 'case-alpha',
    projectId: 'checkout-app',
    deploymentId: 'dep-001',
    service: 'checkout-service',
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
      failureType: 'CONNECTION_POOL_STARVATION',
      symptoms: ['Workers timed out waiting for connection'],
      errorSignatures: [],
      logsSample: [],
    },
    confirmedRootCause: 'Short query timeouts aborted queries while pool was held.',
    verifiedMitigation: 'Increase timeout from 2s to 10s to permit slow queries during migration.',
    outcome: 'resolved',
    confirmation: {
      confirmedBy: 'eng1@corp.com',
      confirmedAt: '2026-11-01T11:00:00Z',
      isConfirmed: true,
      confirmationMethod: 'manual_investigation',
      verificationEvidence: 'Evidence 123',
    },
    tags: [],
  };

  it('detects opposing mitigations (increase timeout vs decrease timeout)', () => {
    const memoryBeta: VerifiedEngineeringMemory = {
      ...baseMemory,
      id: 'case-beta',
      deploymentId: 'dep-002',
      confirmedRootCause: 'Idle queries holding connections for too long.',
      verifiedMitigation: 'Decrease timeout from 10s to 2s to aggressively free idle connections.',
      confirmation: {
        ...baseMemory.confirmation,
        confirmedBy: 'eng2@corp.com',
      },
    };

    const contradictions = detectMemoryContradictions([baseMemory, memoryBeta]);
    expect(contradictions.length).toBe(1);
    expect(contradictions[0].contradictionType).toBe('OPPOSING_MITIGATIONS');
    expect(contradictions[0].topic).toBe('Connection Pool Timeout Policy');
    expect(contradictions[0].description).toContain('recommends an opposite mitigation');
    expect(contradictions[0].resolutionGuidance).toContain('Compare the respective deployment environments');
  });

  it('detects divergent root causes for identical failure types', () => {
    const memoryDatabaseCause: VerifiedEngineeringMemory = {
      ...baseMemory,
      id: 'case-db-lock',
      failureContext: {
        ...baseMemory.failureContext,
        failureType: 'HTTP_504_GATEWAY_TIMEOUT',
      },
      confirmedRootCause: 'Database postgres deadlock held exclusive table lock.',
      verifiedMitigation: 'Apply non-blocking table migration.',
    };

    const memoryGatewayCause: VerifiedEngineeringMemory = {
      ...baseMemory,
      id: 'case-ext-api',
      failureContext: {
        ...baseMemory.failureContext,
        failureType: 'HTTP_504_GATEWAY_TIMEOUT',
      },
      confirmedRootCause: 'Downstream external API rate limit and timeout from Stripe payment gateway.',
      verifiedMitigation: 'Add circuit breaker for payment gateway.',
    };

    const contradictions = detectMemoryContradictions([memoryDatabaseCause, memoryGatewayCause]);
    expect(contradictions.length).toBe(1);
    expect(contradictions[0].contradictionType).toBe('CONFLICTING_ROOT_CAUSES');
    expect(contradictions[0].description).toContain('Database Lock/Saturation');
    expect(contradictions[0].description).toContain('Downstream Network/Third-Party Gateway');
  });

  it('returns empty array when no contradictions exist', () => {
    const memory1: VerifiedEngineeringMemory = { ...baseMemory, id: 'mem-1' };
    const memory2: VerifiedEngineeringMemory = {
      ...baseMemory,
      id: 'mem-2',
      failureContext: {
        ...baseMemory.failureContext,
        failureType: 'OOM_KILL',
      },
      confirmedRootCause: 'Memory leak in worker loop buffer.',
      verifiedMitigation: 'Stream buffer in chunks of 1MB.',
    };

    const contradictions = detectMemoryContradictions([memory1, memory2]);
    expect(contradictions.length).toBe(0);
  });
});
