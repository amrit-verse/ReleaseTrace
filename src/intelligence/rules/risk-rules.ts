/**
 * Deterministic Release-Risk Rules Engine
 * 
 * Evaluates concrete deployment context, git diffs, schema changes, and telemetry
 * against deterministic engineering safety rules prior to LLM reasoning.
 */

import type {
  DeploymentContext,
  DeterministicRuleViolation,
  RiskLevel,
  VerifiedEngineeringMemory,
} from '../types';

export interface RuleEvaluationResult {
  violations: DeterministicRuleViolation[];
  calculatedRisk: RiskLevel;
  hardBlocked: boolean;
  hardBlockReason?: string;
  summary: string;
}

export const RISK_RULE_REGISTRY = [
  { id: 'RT-RULE-001', name: 'Destructive Schema Migration Detected', category: 'DATABASE', severity: 'CRITICAL' },
  { id: 'RT-RULE-002', name: 'Unsafe Index/Migration Lock Guard', category: 'DATABASE', severity: 'HIGH' },
  { id: 'RT-RULE-003', name: 'Production High-Availability Floor Violation', category: 'INFRASTRUCTURE', severity: 'HIGH' },
  { id: 'RT-RULE-004', name: 'Database Connection Pool Over-allocation', category: 'DATABASE', severity: 'HIGH' },
  { id: 'RT-RULE-005', name: 'Active Production Error Spike Pre-Deploy', category: 'TELEMETRY', severity: 'CRITICAL' },
  { id: 'RT-RULE-006', name: 'Pre-Deployment Connection Pool Saturation', category: 'TELEMETRY', severity: 'CRITICAL' },
  { id: 'RT-RULE-007', name: 'High Compute Load Pre-Deploy', category: 'TELEMETRY', severity: 'MEDIUM' },
  { id: 'RT-RULE-008', name: 'Recurrence of Verified Historical Incident Pattern', category: 'MEMORY', severity: 'HIGH' },
] as const;

export function evaluateDeterministicRules(
  deployment: DeploymentContext,
  matchingMemories: VerifiedEngineeringMemory[] = []
): RuleEvaluationResult {
  const violations: DeterministicRuleViolation[] = [];

  // Rule 1: Destructive Schema Changes on Production
  if (deployment.gitDiffSummary.hasDatabaseMigrations) {
    const migrationDetails = (deployment.gitDiffSummary.migrationDetails || '').toUpperCase();
    const destructiveKeywords = ['DROP TABLE', 'DROP COLUMN', 'ALTER TABLE DROP', 'TRUNCATE', 'CASCADE'];

    for (const kw of destructiveKeywords) {
      if (migrationDetails.includes(kw)) {
        violations.push({
          ruleId: 'RT-RULE-001',
          ruleName: 'Destructive Schema Migration Detected',
          severity: deployment.targetEnvironment === 'production' ? 'CRITICAL' : 'HIGH',
          description: `Migration contains irreversible destructive operation (${kw}). This drops data and breaks backward compatibility for in-flight requests.`,
          remediation: 'Implement expand-and-contract (two-phase) schema evolution. Soft-deprecate columns before dropping.',
          evidence: `Found '${kw}' in migration details.`,
        });
        break;
      }
    }

    // Rule 2: Unbounded Table Lock / Missing Statement Timeout Guard
    if (
      deployment.targetEnvironment === 'production' &&
      !migrationDetails.includes('SET lock_timeout') &&
      !migrationDetails.includes('CONCURRENTLY')
    ) {
      violations.push({
        ruleId: 'RT-RULE-002',
        ruleName: 'Unsafe Index/Migration Lock Guard',
        severity: 'HIGH',
        description: 'Production migration lacks statement/lock timeout guards or non-concurrent index creation. Risk of queueing locks and causing table-level starvation.',
        remediation: 'Add `SET lock_timeout = "2s";` before DDL statements and use `CREATE INDEX CONCURRENTLY`.',
        evidence: 'Migration lacks lock_timeout or CONCURRENTLY qualifiers.',
      });
    }
  }

  // Rule 3: Single Point of Failure (Replica Count < 2 in Production)
  if (deployment.targetEnvironment === 'production' && deployment.environment.infrastructure.replicas < 2) {
    violations.push({
      ruleId: 'RT-RULE-003',
      ruleName: 'Production High-Availability Floor Violation',
      severity: 'HIGH',
      description: `Target environment has only ${deployment.environment.infrastructure.replicas} replica(s). Rolling updates with single replica guarantee downtime.`,
      remediation: 'Configure at least 2 replicas with pod anti-affinity in production before deploying.',
      evidence: `infrastructure.replicas = ${deployment.environment.infrastructure.replicas}`,
    });
  }

  // Rule 4: Connection Pool Capacity vs Replica Scalability
  const poolSize = deployment.environment.database.poolSize ?? 10;
  const replicas = deployment.environment.infrastructure.replicas;
  const totalMaxConnections = poolSize * replicas;

  if (totalMaxConnections > 300) {
    violations.push({
      ruleId: 'RT-RULE-004',
      ruleName: 'Database Connection Pool Over-allocation',
      severity: 'HIGH',
      description: `Aggregate connection capacity (${replicas} replicas * ${poolSize} pool = ${totalMaxConnections} max connections) exceeds safe thresholds for standalone PostgreSQL without proxy.`,
      remediation: 'Deploy PgBouncer / RDS Proxy or decrease per-replica pool size.',
      evidence: `Total potential connections: ${totalMaxConnections}`,
    });
  }

  // Rule 5: Active Pre-Deployment Telemetry Degradation
  if (deployment.telemetrySnapshot) {
    const { errorRate, connectionPoolSaturation, cpuUtilization } = deployment.telemetrySnapshot;

    if (errorRate > 0.05) {
      violations.push({
        ruleId: 'RT-RULE-005',
        ruleName: 'Active Production Error Spike Pre-Deploy',
        severity: 'CRITICAL',
        description: `Pre-deployment baseline error rate is ${(errorRate * 100).toFixed(1)}% (threshold: 5%). Deploying on top of an active incident violates safety gates.`,
        remediation: 'Halt deployment until active baseline errors return to normal operating range (< 0.5%).',
        evidence: `telemetry.errorRate = ${(errorRate * 100).toFixed(1)}%`,
      });
    }

    if (connectionPoolSaturation > 0.85) {
      violations.push({
        ruleId: 'RT-RULE-006',
        ruleName: 'Pre-Deployment Connection Pool Saturation',
        severity: 'CRITICAL',
        description: `Database connection pool is already ${(connectionPoolSaturation * 100).toFixed(0)}% saturated before rollout. Additional traffic or migrations will trigger connection exhaustion.`,
        remediation: 'Investigate idle/leaked connections or scale database proxy capacity before proceeding.',
        evidence: `telemetry.connectionPoolSaturation = ${(connectionPoolSaturation * 100).toFixed(0)}%`,
      });
    }

    if (cpuUtilization > 0.85) {
      violations.push({
        ruleId: 'RT-RULE-007',
        ruleName: 'High Compute Load Pre-Deploy',
        severity: 'MEDIUM',
        description: `Node CPU utilization is at ${(cpuUtilization * 100).toFixed(0)}%. Pod restarts during rolling release may cause CPU throttling.`,
        remediation: 'Consider scaling out replicas prior to initiating rolling deployment.',
        evidence: `telemetry.cpuUtilization = ${(cpuUtilization * 100).toFixed(0)}%`,
      });
    }
  }

  // Rule 6: Historical Recurrence Amplification Rule
  // If matching verified memories had the exact failure type and root cause
  if (matchingMemories.length > 0) {
    for (const mem of matchingMemories) {
      if (
        deployment.gitDiffSummary.hasDatabaseMigrations &&
        mem.failureContext.failureType.toLowerCase().includes('pool')
      ) {
        violations.push({
          ruleId: 'RT-RULE-008',
          ruleName: 'Recurrence of Verified Historical Incident Pattern',
          severity: 'HIGH',
          description: `This deployment introduces changes resembling verified historical incident ${mem.id} (${mem.failureContext.failureType}), confirmed by ${mem.confirmation.confirmedBy}.`,
          remediation: `Apply confirmed mitigation: ${mem.verifiedMitigation}`,
          evidence: `Historical incident ${mem.id}: "${mem.confirmedRootCause}"`,
        });
        break;
      }
    }
  }

  // Determine overall risk
  let calculatedRisk: RiskLevel = 'LOW';
  const hasCritical = violations.some(v => v.severity === 'CRITICAL');
  const hasHigh = violations.some(v => v.severity === 'HIGH');
  const hasMedium = violations.some(v => v.severity === 'MEDIUM');

  if (hasCritical) calculatedRisk = 'CRITICAL';
  else if (hasHigh) calculatedRisk = 'HIGH';
  else if (hasMedium) calculatedRisk = 'MEDIUM';

  const hardBlocked = hasCritical && deployment.targetEnvironment === 'production';
  const hardBlockReason = hardBlocked
    ? `Hard block triggered by critical deterministic safety rule violations: ${violations.filter(v => v.severity === 'CRITICAL').map(v => v.ruleName).join('; ')}`
    : undefined;

  const summary = violations.length === 0
    ? 'All deterministic release-risk rules passed successfully.'
    : `Evaluated ${violations.length} rule violation(s). Highest severity: ${calculatedRisk}.`;

  return {
    violations,
    calculatedRisk,
    hardBlocked,
    hardBlockReason,
    summary,
  };
}
