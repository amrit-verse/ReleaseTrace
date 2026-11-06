/**
 * Memory Contradiction Detection Engine
 * 
 * Enforces the core ReleaseTrace invariant:
 * "If memories contradict each other, surface the conflict."
 */

import type { VerifiedEngineeringMemory, Contradiction } from '../types';

export function detectMemoryContradictions(
  memories: VerifiedEngineeringMemory[]
): Contradiction[] {
  const contradictions: Contradiction[] = [];

  if (!memories || memories.length < 2) {
    return contradictions;
  }

  // Compare all pairs of memories
  for (let i = 0; i < memories.length; i++) {
    for (let j = i + 1; j < memories.length; j++) {
      const memA = memories[i];
      const memB = memories[j];

      // Check 1: Opposing Mitigations (e.g., Increase vs Decrease parameters)
      const opposingMitigation = findOpposingMitigation(memA, memB);
      if (opposingMitigation) {
        contradictions.push({
          id: `contradiction-${memA.id}-${memB.id}-mitigation`,
          topic: opposingMitigation.topic,
          contradictionType: 'OPPOSING_MITIGATIONS',
          memoryA: {
            id: memA.id,
            rootCause: memA.confirmedRootCause,
            mitigation: memA.verifiedMitigation,
            conditions: formatConditionsBrief(memA),
          },
          memoryB: {
            id: memB.id,
            rootCause: memB.confirmedRootCause,
            mitigation: memB.verifiedMitigation,
            conditions: formatConditionsBrief(memB),
          },
          description: opposingMitigation.description,
          resolutionGuidance: opposingMitigation.resolutionGuidance,
        });
        continue;
      }

      // Check 2: Same Failure Type / Symptoms but Conflicting Root Causes
      const conflictingCause = findConflictingRootCauses(memA, memB);
      if (conflictingCause) {
        contradictions.push({
          id: `contradiction-${memA.id}-${memB.id}-cause`,
          topic: conflictingCause.topic,
          contradictionType: 'CONFLICTING_ROOT_CAUSES',
          memoryA: {
            id: memA.id,
            rootCause: memA.confirmedRootCause,
            mitigation: memA.verifiedMitigation,
            conditions: formatConditionsBrief(memA),
          },
          memoryB: {
            id: memB.id,
            rootCause: memB.confirmedRootCause,
            mitigation: memB.verifiedMitigation,
            conditions: formatConditionsBrief(memB),
          },
          description: conflictingCause.description,
          resolutionGuidance: conflictingCause.resolutionGuidance,
        });
        continue;
      }

      // Check 3: Version-Conditional Operational Conflicts
      const versionConflict = findVersionConditionalConflict(memA, memB);
      if (versionConflict) {
        contradictions.push({
          id: `contradiction-${memA.id}-${memB.id}-env`,
          topic: versionConflict.topic,
          contradictionType: 'ENVIRONMENT_CONDITIONAL_CONFLICT',
          memoryA: {
            id: memA.id,
            rootCause: memA.confirmedRootCause,
            mitigation: memA.verifiedMitigation,
            conditions: formatConditionsBrief(memA),
          },
          memoryB: {
            id: memB.id,
            rootCause: memB.confirmedRootCause,
            mitigation: memB.verifiedMitigation,
            conditions: formatConditionsBrief(memB),
          },
          description: versionConflict.description,
          resolutionGuidance: versionConflict.resolutionGuidance,
        });
      }
    }
  }

  return contradictions;
}

interface OpposingPattern {
  topic: string;
  incTerms: string[];
  decTerms: string[];
}

const OPPOSING_PATTERNS: OpposingPattern[] = [
  {
    topic: 'Connection Pool Timeout Policy',
    incTerms: ['increase timeout', 'raise timeout', 'higher timeout', 'extend timeout'],
    decTerms: ['decrease timeout', 'lower timeout', 'reduce timeout', 'shorter timeout'],
  },
  {
    topic: 'Connection Pool Sizing',
    incTerms: ['increase pool size', 'raise pool size', 'increase max connections', 'expand pool'],
    decTerms: ['decrease pool size', 'lower pool size', 'limit pool size', 'reduce connections'],
  },
  {
    topic: 'Batch Processing Concurrency',
    incTerms: ['increase batch size', 'enable batching', 'parallelize'],
    decTerms: ['decrease batch size', 'disable batching', 'serialize', 'throttle'],
  },
  {
    topic: 'Cache Retention / Invalidation',
    incTerms: ['increase ttl', 'enable cache', 'keep in cache'],
    decTerms: ['decrease ttl', 'bypass cache', 'disable cache', 'flush cache'],
  },
];

function findOpposingMitigation(
  memA: VerifiedEngineeringMemory,
  memB: VerifiedEngineeringMemory
): { topic: string; description: string; resolutionGuidance: string } | null {
  const textA = `${memA.verifiedMitigation} ${memA.confirmedRootCause}`.toLowerCase();
  const textB = `${memB.verifiedMitigation} ${memB.confirmedRootCause}`.toLowerCase();

  for (const pattern of OPPOSING_PATTERNS) {
    const aIncreases = pattern.incTerms.some(term => textA.includes(term));
    const aDecreases = pattern.decTerms.some(term => textA.includes(term));

    const bIncreases = pattern.incTerms.some(term => textB.includes(term));
    const bDecreases = pattern.decTerms.some(term => textB.includes(term));

    if ((aIncreases && bDecreases) || (aDecreases && bIncreases)) {
      return {
        topic: pattern.topic,
        description: `Memory ${memA.id} recommends an opposite mitigation compared to Memory ${memB.id} regarding '${pattern.topic}'. One suggests increasing/expanding while the other suggests decreasing/throttling.`,
        resolutionGuidance: `Compare the respective deployment environments. Notice differing conditions: Memory ${memA.id} was applied under (${formatConditionsBrief(memA)}), whereas Memory ${memB.id} was applied under (${formatConditionsBrief(memB)}). Select the policy corresponding to your current traffic and infrastructure capacity.`,
      };
    }
  }

  return null;
}

function findConflictingRootCauses(
  memA: VerifiedEngineeringMemory,
  memB: VerifiedEngineeringMemory
): { topic: string; description: string; resolutionGuidance: string } | null {
  // If failure type is identical and symptoms strongly overlap, but root causes cite entirely different components
  const typeA = memA.failureContext.failureType.toLowerCase();
  const typeB = memB.failureContext.failureType.toLowerCase();

  if (typeA === typeB && memA.id !== memB.id) {
    const causeA = memA.confirmedRootCause.toLowerCase();
    const causeB = memB.confirmedRootCause.toLowerCase();

    // Look for divergent architectural culprits
    const culprits = [
      { name: 'Database Lock/Saturation', terms: ['database', 'postgres', 'pool', 'lock', 'deadlock', 'query'] },
      { name: 'Downstream Network/Third-Party Gateway', terms: ['gateway', 'network', 'external api', 'dns', 'http 502', 'timeout from stripe'] },
      { name: 'Memory Leak / Heap Exhaustion', terms: ['heap', 'oom', 'out of memory', 'gc pause', 'memory leak'] },
    ];

    let culpritA = '';
    let culpritB = '';

    for (const c of culprits) {
      if (c.terms.some(t => causeA.includes(t))) culpritA = c.name;
      if (c.terms.some(t => causeB.includes(t))) culpritB = c.name;
    }

    if (culpritA && culpritB && culpritA !== culpritB) {
      return {
        topic: `Divergent Root Causes for ${memA.failureContext.failureType}`,
        description: `Memories ${memA.id} and ${memB.id} observed the same failure type '${memA.failureContext.failureType}', but confirmed opposing root causes: '${culpritA}' vs '${culpritB}'.`,
        resolutionGuidance: `Verify current telemetry: Check whether metrics indicate ${culpritA} (e.g. active DB connections) or ${culpritB} (e.g. heap memory usage or external HTTP latency) before applying a remediation.`,
      };
    }
  }

  return null;
}

function findVersionConditionalConflict(
  memA: VerifiedEngineeringMemory,
  memB: VerifiedEngineeringMemory
): { topic: string; description: string; resolutionGuidance: string } | null {
  if (memA.environment.database.version !== memB.environment.database.version) {
    const textA = memA.verifiedMitigation.toLowerCase();
    const textB = memB.verifiedMitigation.toLowerCase();

    if (textA.includes('vacuum') && textB.includes('vacuum')) {
      return {
        topic: 'Database Vacuum Strategy Across Versions',
        description: `Memory ${memA.id} (DB v${memA.environment.database.version}) and Memory ${memB.id} (DB v${memB.environment.database.version}) document incompatible vacuum maintenance procedures.`,
        resolutionGuidance: `Consult the database version docs for target version v${memA.environment.database.version} before running maintenance locks.`,
      };
    }
  }

  return null;
}

function formatConditionsBrief(mem: VerifiedEngineeringMemory): string {
  return `${mem.environment.runtime}, ${mem.environment.database.type} v${mem.environment.database.version}, pool: ${mem.environment.database.poolSize ?? 'default'}, ${mem.environment.infrastructure.replicas} replicas`;
}
