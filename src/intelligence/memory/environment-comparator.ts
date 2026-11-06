/**
 * Context & Environment Comparison Engine
 * 
 * Compares current deployment conditions against historical incident environments.
 * Enforces the core ReleaseTrace invariant:
 * "Historical conditions must accompany recommendations. If conditions differ, explain the mismatch."
 */

import type {
  EnvironmentConfig,
  EnvironmentComparisonResult,
  EnvironmentDifference,
} from '../types';

export interface ComparisonOptions {
  failureType?: string;
}

export function compareEnvironments(
  historicalEnv: EnvironmentConfig,
  currentEnv: EnvironmentConfig,
  options: ComparisonOptions = {}
): EnvironmentComparisonResult {
  const differences: EnvironmentDifference[] = [];
  const identicalKeys: string[] = [];
  const differingKeys: string[] = [];

  // 1. Runtime Comparison
  if (historicalEnv.runtime !== currentEnv.runtime) {
    differingKeys.push('runtime');
    const isMajor = extractMajorVersion(historicalEnv.runtime) !== extractMajorVersion(currentEnv.runtime);
    differences.push({
      category: 'runtime',
      parameter: 'runtime',
      historicalValue: historicalEnv.runtime,
      currentValue: currentEnv.runtime,
      severity: isMajor ? 'CRITICAL_MISMATCH' : 'MODERATE_DIVERGENCE',
      impactExplanation: `Runtime environment changed from ${historicalEnv.runtime} to ${currentEnv.runtime}. ${
        isMajor ? 'Major engine upgrade may alter runtime event loop, garbage collection, or async stack handling.' : 'Minor runtime revision.'
      }`,
    });
  } else {
    identicalKeys.push('runtime');
  }

  // 2. Database Comparison
  const hDb = historicalEnv.database;
  const cDb = currentEnv.database;

  if (hDb.type !== cDb.type) {
    differingKeys.push('database.type');
    differences.push({
      category: 'database',
      parameter: 'database.type',
      historicalValue: hDb.type,
      currentValue: cDb.type,
      severity: 'CRITICAL_MISMATCH',
      impactExplanation: `Underlying database engine changed from ${hDb.type} to ${cDb.type}. Historical queries and connection behaviors do not map directly.`,
    });
  } else {
    identicalKeys.push('database.type');
  }

  if (hDb.version !== cDb.version) {
    differingKeys.push('database.version');
    const isMajorDb = extractMajorVersion(hDb.version) !== extractMajorVersion(cDb.version);
    differences.push({
      category: 'database',
      parameter: 'database.version',
      historicalValue: hDb.version,
      currentValue: cDb.version,
      severity: isMajorDb ? 'CRITICAL_MISMATCH' : 'MODERATE_DIVERGENCE',
      impactExplanation: `Database version differs: historical failure occurred on v${hDb.version}, current deployment targets v${cDb.version}. Query planner and indexing rules may differ.`,
    });
  } else {
    identicalKeys.push('database.version');
  }

  if (hDb.poolSize !== cDb.poolSize) {
    differingKeys.push('database.poolSize');
    const isDbPoolFailure = options.failureType?.toLowerCase().includes('pool') ||
                            options.failureType?.toLowerCase().includes('connection');
    differences.push({
      category: 'database',
      parameter: 'database.poolSize',
      historicalValue: hDb.poolSize ?? 'default',
      currentValue: cDb.poolSize ?? 'default',
      severity: isDbPoolFailure ? 'CRITICAL_MISMATCH' : 'MODERATE_DIVERGENCE',
      impactExplanation: `Connection pool capacity differs (historical: ${hDb.poolSize ?? 'default'}, current: ${cDb.poolSize ?? 'default'}). Concurrency bottlenecks may manifest at different thresholds.`,
    });
  } else if (hDb.poolSize !== undefined) {
    identicalKeys.push('database.poolSize');
  }

  if (hDb.maxIdleTimeoutMs !== cDb.maxIdleTimeoutMs) {
    differingKeys.push('database.maxIdleTimeoutMs');
    differences.push({
      category: 'database',
      parameter: 'database.maxIdleTimeoutMs',
      historicalValue: hDb.maxIdleTimeoutMs ?? 'unset',
      currentValue: cDb.maxIdleTimeoutMs ?? 'unset',
      severity: 'MODERATE_DIVERGENCE',
      impactExplanation: `Connection idle timeout changed from ${hDb.maxIdleTimeoutMs ?? 'unset'}ms to ${cDb.maxIdleTimeoutMs ?? 'unset'}ms.`,
    });
  } else if (hDb.maxIdleTimeoutMs !== undefined) {
    identicalKeys.push('database.maxIdleTimeoutMs');
  }

  // 3. Infrastructure Comparison
  const hInfra = historicalEnv.infrastructure;
  const cInfra = currentEnv.infrastructure;

  if (hInfra.replicas !== cInfra.replicas) {
    differingKeys.push('infrastructure.replicas');
    differences.push({
      category: 'infrastructure',
      parameter: 'infrastructure.replicas',
      historicalValue: hInfra.replicas,
      currentValue: cInfra.replicas,
      severity: 'MODERATE_DIVERGENCE',
      impactExplanation: `Replica count changed from ${hInfra.replicas} to ${cInfra.replicas}. Multi-instance concurrency multiplied against downstream dependencies.`,
    });
  } else {
    identicalKeys.push('infrastructure.replicas');
  }

  if (hInfra.provider !== cInfra.provider || hInfra.region !== cInfra.region) {
    differingKeys.push('infrastructure.location');
    differences.push({
      category: 'infrastructure',
      parameter: 'infrastructure.location',
      historicalValue: `${hInfra.provider}/${hInfra.region}`,
      currentValue: `${cInfra.provider}/${cInfra.region}`,
      severity: 'INFORMATIONAL',
      impactExplanation: `Deployment target region/cloud differs: historical was ${hInfra.provider}/${hInfra.region}, current is ${cInfra.provider}/${cInfra.region}.`,
    });
  } else {
    identicalKeys.push('infrastructure.location');
  }

  // 4. Feature Flags Comparison
  const allFlags = new Set([
    ...Object.keys(historicalEnv.featureFlags || {}),
    ...Object.keys(currentEnv.featureFlags || {}),
  ]);

  for (const flag of allFlags) {
    const hVal = historicalEnv.featureFlags?.[flag];
    const cVal = currentEnv.featureFlags?.[flag];
    if (hVal !== cVal) {
      differingKeys.push(`featureFlags.${flag}`);
      differences.push({
        category: 'featureFlags',
        parameter: `featureFlags.${flag}`,
        historicalValue: hVal ?? 'unset',
        currentValue: cVal ?? 'unset',
        severity: 'MODERATE_DIVERGENCE',
        impactExplanation: `Feature flag '${flag}' was '${hVal}' during historical incident, but is '${cVal}' in current deployment.`,
      });
    } else {
      identicalKeys.push(`featureFlags.${flag}`);
    }
  }

  // Calculate Match Score
  const totalEvaluated = identicalKeys.length + differingKeys.length;
  let matchScore = 1.0;

  if (totalEvaluated > 0) {
    let penalty = 0;
    for (const diff of differences) {
      if (diff.severity === 'CRITICAL_MISMATCH') penalty += 0.35;
      else if (diff.severity === 'MODERATE_DIVERGENCE') penalty += 0.15;
      else penalty += 0.05;
    }
    matchScore = Math.max(0.0, Math.min(1.0, 1.0 - penalty));
  }

  const isMatch = differences.filter(d => d.severity === 'CRITICAL_MISMATCH').length === 0 && matchScore >= 0.70;

  // Build Comprehensive Explanation
  let explanation = '';
  if (differences.length === 0) {
    explanation = 'Target environment parameters match historical incident conditions identically.';
  } else {
    const criticalDiffs = differences.filter(d => d.severity === 'CRITICAL_MISMATCH');
    const moderateDiffs = differences.filter(d => d.severity === 'MODERATE_DIVERGENCE');

    const lines: string[] = [];
    if (criticalDiffs.length > 0) {
      lines.push(`CRITICAL ENVIRONMENT DIVERGENCES (${criticalDiffs.length}):`);
      for (const cd of criticalDiffs) {
        lines.push(`- ${cd.parameter}: historical was ${JSON.stringify(cd.historicalValue)}, current is ${JSON.stringify(cd.currentValue)}. ${cd.impactExplanation}`);
      }
    }

    if (moderateDiffs.length > 0) {
      lines.push(`MODERATE DIVERGENCES (${moderateDiffs.length}):`);
      for (const md of moderateDiffs) {
        lines.push(`- ${md.parameter}: historical was ${JSON.stringify(md.historicalValue)}, current is ${JSON.stringify(md.currentValue)}. ${md.impactExplanation}`);
      }
    }

    lines.push(`Overall Environment Compatibility Score: ${(matchScore * 100).toFixed(0)}%. ${
      isMatch
        ? 'Conditions are sufficiently aligned; historical mitigation is directly applicable with standard precautions.'
        : 'Significant condition mismatch detected. Historical mitigation must be adjusted to current architecture.'
    }`);

    explanation = lines.join('\n');
  }

  return {
    isMatch,
    matchScore,
    identicalKeys,
    differingKeys,
    differences,
    explanation,
  };
}

function extractMajorVersion(versionString: string): string {
  const match = versionString.match(/\d+/);
  return match ? match[0] : versionString;
}
