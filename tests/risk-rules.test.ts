import { describe, it, expect } from 'vitest';
import { evaluateDeterministicRules } from '../src/intelligence/rules/risk-rules';
import type { DeploymentContext } from '../src/intelligence/types';

describe('Deterministic Release-Risk Rules Engine', () => {
  const safeDeployment: DeploymentContext = {
    deploymentId: 'dep-safe-01',
    projectId: 'user-service',
    service: 'user-service',
    timestamp: '2026-11-06T12:00:00Z',
    commitHash: 'commit1',
    branch: 'main',
    gitDiffSummary: {
      filesChanged: ['src/routes/users.ts'],
      additions: 12,
      deletions: 3,
      hasDatabaseMigrations: false,
    },
    environment: {
      runtime: 'nodejs@20.11.0',
      database: { type: 'postgresql', version: '15.1', poolSize: 10 },
      infrastructure: { provider: 'aws', region: 'us-east-1', replicas: 3 },
      featureFlags: {},
      envVariables: {},
      dependencies: {},
    },
    targetEnvironment: 'production',
  };

  it('passes all checks with LOW risk for safe non-migration deployment', () => {
    const result = evaluateDeterministicRules(safeDeployment);
    expect(result.calculatedRisk).toBe('LOW');
    expect(result.hardBlocked).toBe(false);
    expect(result.violations.length).toBe(0);
  });

  it('triggers CRITICAL risk and hard block for destructive table drop on production', () => {
    const destructiveDeployment: DeploymentContext = {
      ...safeDeployment,
      gitDiffSummary: {
        filesChanged: ['migrations/005_drop_table.sql'],
        additions: 1,
        deletions: 1,
        hasDatabaseMigrations: true,
        migrationDetails: 'DROP TABLE user_audit_logs CASCADE;',
      },
    };

    const result = evaluateDeterministicRules(destructiveDeployment);
    expect(result.calculatedRisk).toBe('CRITICAL');
    expect(result.hardBlocked).toBe(true);
    expect(result.violations.some(v => v.ruleId === 'RT-RULE-001')).toBe(true);
    expect(result.hardBlockReason).toContain('Destructive Schema Migration Detected');
  });

  it('flags production deployment with replica count < 2 as HIGH risk', () => {
    const singleReplicaDeploy: DeploymentContext = {
      ...safeDeployment,
      environment: {
        ...safeDeployment.environment,
        infrastructure: {
          ...safeDeployment.environment.infrastructure,
          replicas: 1, // Single point of failure!
        },
      },
    };

    const result = evaluateDeterministicRules(singleReplicaDeploy);
    expect(result.calculatedRisk).toBe('HIGH');
    expect(result.violations.some(v => v.ruleId === 'RT-RULE-003')).toBe(true);
  });

  it('flags active pre-deployment error spike as CRITICAL risk', () => {
    const spikingDeploy: DeploymentContext = {
      ...safeDeployment,
      telemetrySnapshot: {
        errorRate: 0.08, // 8% error rate (> 5%)
        p95LatencyMs: 400,
        cpuUtilization: 0.40,
        memoryUtilization: 0.50,
        connectionPoolSaturation: 0.30,
      },
    };

    const result = evaluateDeterministicRules(spikingDeploy);
    expect(result.calculatedRisk).toBe('CRITICAL');
    expect(result.violations.some(v => v.ruleId === 'RT-RULE-005')).toBe(true);
  });
});
