import { describe, it, expect } from 'vitest';
import { compareEnvironments } from '../src/intelligence/memory/environment-comparator';
import type { EnvironmentConfig } from '../src/intelligence/types';

describe('Environment Comparator Engine', () => {
  const baseEnv: EnvironmentConfig = {
    runtime: 'nodejs@20.11.0',
    database: {
      type: 'postgresql',
      version: '14.2',
      poolSize: 15,
      maxIdleTimeoutMs: 10000,
    },
    infrastructure: {
      provider: 'aws',
      region: 'us-east-1',
      replicas: 4,
    },
    featureFlags: { fastCheckout: true },
    envVariables: { NODE_ENV: 'production' },
    dependencies: { pg: '8.11.0' },
  };

  it('reports exact match and 1.0 score when environments are identical', () => {
    const result = compareEnvironments(baseEnv, { ...baseEnv });
    expect(result.isMatch).toBe(true);
    expect(result.matchScore).toBe(1.0);
    expect(result.differences.length).toBe(0);
    expect(result.explanation).toContain('match historical incident conditions identically');
  });

  it('flags database type change as CRITICAL_MISMATCH', () => {
    const currentEnv: EnvironmentConfig = {
      ...baseEnv,
      database: {
        ...baseEnv.database,
        type: 'mysql',
      },
    };

    const result = compareEnvironments(baseEnv, currentEnv);
    expect(result.isMatch).toBe(false);
    expect(result.matchScore).toBeLessThan(0.70);
    const dbDiff = result.differences.find(d => d.parameter === 'database.type');
    expect(dbDiff?.severity).toBe('CRITICAL_MISMATCH');
    expect(result.explanation).toContain('CRITICAL ENVIRONMENT DIVERGENCES');
  });

  it('flags pool size mismatch as CRITICAL_MISMATCH when failure is pool-related', () => {
    const currentEnv: EnvironmentConfig = {
      ...baseEnv,
      database: {
        ...baseEnv.database,
        poolSize: 50,
      },
    };

    const result = compareEnvironments(baseEnv, currentEnv, {
      failureType: 'DB_CONNECTION_POOL_EXHAUSTION',
    });

    const poolDiff = result.differences.find(d => d.parameter === 'database.poolSize');
    expect(poolDiff?.severity).toBe('CRITICAL_MISMATCH');
    expect(result.explanation).toContain('Connection pool capacity differs');
  });

  it('flags runtime major version upgrade and explains impact', () => {
    const currentEnv: EnvironmentConfig = {
      ...baseEnv,
      runtime: 'nodejs@22.0.0',
    };

    const result = compareEnvironments(baseEnv, currentEnv);
    const runtimeDiff = result.differences.find(d => d.parameter === 'runtime');
    expect(runtimeDiff?.severity).toBe('CRITICAL_MISMATCH');
    expect(runtimeDiff?.impactExplanation).toContain('Major engine upgrade');
  });

  it('detects feature flag divergences', () => {
    const currentEnv: EnvironmentConfig = {
      ...baseEnv,
      featureFlags: { fastCheckout: false },
    };

    const result = compareEnvironments(baseEnv, currentEnv);
    const flagDiff = result.differences.find(d => d.parameter === 'featureFlags.fastCheckout');
    expect(flagDiff).toBeDefined();
    expect(flagDiff?.historicalValue).toBe(true);
    expect(flagDiff?.currentValue).toBe(false);
  });
});
