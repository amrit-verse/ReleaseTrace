/**
 * ReleaseTrace LLM Prompts with Built-in Memory Invariants
 * 
 * Enforces:
 * - Separation of current evidence vs historical memories
 * - Ground truth verification requirements
 * - Condition mismatch explanations
 * - Contradiction surfacing
 * - Empty / weak recall abstention
 */

import type {
  DeploymentContext,
  EnvironmentComparisonResult,
  Contradiction,
  DeterministicRuleViolation,
} from '../types';
import type { ScoredMemory } from '../memory/relevance';

export const RELEASETRACE_SYSTEM_PROMPT = `
You are the ReleaseTrace Lead Risk & Persistent Memory Intelligence Engine.
Your mission is to provide rigorous, evidence-based release risk assessments that improve over time through verified engineering experience.

YOU MUST ADHERE TO THESE NON-NEGOTIABLE MEMORY INVARIANTS:
1. ONLY ENGINEER-CONFIRMED OUTCOMES: Only cite memories confirmed by a human engineer.
2. NEVER TREAT AN LLM HYPOTHESIS AS A VERIFIED ROOT CAUSE: Do not guess root causes. If an incident root cause is unverified, declare it an unverified hypothesis.
3. NEVER TREAT HISTORICAL MEMORY AS CURRENT EVIDENCE: Memories are historical precedents, NOT current telemetry. Real-time diffs and logs are current evidence.
4. HISTORICAL CONDITIONS MUST ACCOMPANY RECOMMENDATIONS: Every recommendation citing past experience MUST explicitly include the historical environment conditions (runtime, database version, pool size, replicas).
5. EXPLAIN MISMATCHES: If current environment parameters differ from historical conditions, explain the exact divergence and whether the historical mitigation applies or needs adaptation.
6. SURFACE CONTRADICTIONS: If recalled memories conflict or suggest opposing mitigations, highlight the contradiction and present the decision criteria to the engineer.
7. ABSTAIN RATHER THAN HALLUCINATE: If no memories exist or recall is weak, you MUST abstain from citing historical experience and evaluate strictly using current evidence and deterministic rules.

YOU MUST ALWAYS RETURN STRICT VALID JSON MATCHING THE REQUESTED SCHEMA.
`;

export function buildAssessmentPrompt(params: {
  deployment: DeploymentContext;
  ruleViolations: DeterministicRuleViolation[];
  qualifiedMemories: ScoredMemory[];
  environmentComparison?: EnvironmentComparisonResult;
  contradictions: Contradiction[];
  shouldAbstain: boolean;
  abstentionReason?: string;
}): string {
  const {
    deployment,
    ruleViolations,
    qualifiedMemories,
    environmentComparison,
    contradictions,
    shouldAbstain,
    abstentionReason,
  } = params;

  const currentEvidence = [
    `SERVICE: ${deployment.service}`,
    `DEPLOYMENT ID: ${deployment.deploymentId}`,
    `TARGET ENVIRONMENT: ${deployment.targetEnvironment}`,
    `GIT DIFF SUMMARY:`,
    `- Files Changed (${deployment.gitDiffSummary.filesChanged.length}): ${deployment.gitDiffSummary.filesChanged.join(', ')}`,
    `- Additions: +${deployment.gitDiffSummary.additions}, Deletions: -${deployment.gitDiffSummary.deletions}`,
    `- Database Migrations: ${deployment.gitDiffSummary.hasDatabaseMigrations ? 'YES' : 'NO'}`,
    deployment.gitDiffSummary.migrationDetails ? `- Migration Details: ${deployment.gitDiffSummary.migrationDetails}` : '',
    `CURRENT ENVIRONMENT:`,
    `- Runtime: ${deployment.environment.runtime}`,
    `- Database: ${deployment.environment.database.type} v${deployment.environment.database.version} (Pool: ${deployment.environment.database.poolSize ?? 'default'}, Timeout: ${deployment.environment.database.maxIdleTimeoutMs ?? 'default'}ms)`,
    `- Infrastructure: ${deployment.environment.infrastructure.provider} (${deployment.environment.infrastructure.replicas} replicas)`,
    deployment.telemetrySnapshot
      ? `CURRENT TELEMETRY SNAPSHOT: Error Rate: ${(deployment.telemetrySnapshot.errorRate * 100).toFixed(1)}%, P95: ${deployment.telemetrySnapshot.p95LatencyMs}ms, Pool Saturation: ${(deployment.telemetrySnapshot.connectionPoolSaturation * 100).toFixed(0)}%`
      : 'CURRENT TELEMETRY SNAPSHOT: Normal / No pre-deploy telemetry anomalies reported.',
  ].filter(Boolean).join('\n');

  const deterministicRulesSection = ruleViolations.length === 0
    ? 'DETERMINISTIC RULE VIOLATIONS: None (All baseline safety gates passed).'
    : [
        `DETERMINISTIC RULE VIOLATIONS (${ruleViolations.length}):`,
        ...ruleViolations.map(v => `- [${v.severity}] ${v.ruleName} (${v.ruleId}): ${v.description}. Remediation: ${v.remediation}`),
      ].join('\n');

  let historicalSection = '';
  if (shouldAbstain) {
    historicalSection = [
      `HISTORICAL MEMORY STATUS: ABSTAINED`,
      `REASON: ${abstentionReason || 'No sufficiently relevant verified experiences found.'}`,
      `INSTRUCTION: Rely solely on current evidence and deterministic rules. Do NOT fabricate historical analogies.`,
    ].join('\n');
  } else {
    historicalSection = [
      `RECALLED VERIFIED HISTORICAL INCIDENTS (${qualifiedMemories.length}):`,
      ...qualifiedMemories.map(qm => {
        const m = qm.memory;
        return [
          `--- INCIDENT CASE ${m.id} ---`,
          `CONFIRMED BY: ${m.confirmation.confirmedBy} on ${m.confirmation.confirmedAt} (${m.confirmation.confirmationMethod})`,
          `CONFIRMED ROOT CAUSE: ${m.confirmedRootCause}`,
          `VERIFIED MITIGATION: ${m.verifiedMitigation}`,
          `HISTORICAL CONDITIONS: ${m.environment.runtime}, ${m.environment.database.type} v${m.environment.database.version}, pool: ${m.environment.database.poolSize ?? 'default'}, ${m.environment.infrastructure.replicas} replicas`,
          `RELEVANCE SCORE: ${(qm.finalRelevanceScore * 100).toFixed(0)}%`,
        ].join('\n');
      }),
    ].join('\n\n');
  }

  const envMismatchSection = environmentComparison
    ? [
        `ENVIRONMENT COMPARISON WITH HISTORICAL INCIDENT:`,
        `- Compatibility Score: ${(environmentComparison.matchScore * 100).toFixed(0)}%`,
        `- Condition Mismatch Explanation:\n${environmentComparison.explanation}`,
      ].join('\n')
    : '';

  const contradictionSection = contradictions.length > 0
    ? [
        `DETECTED MEMORY CONTRADICTIONS (${contradictions.length}):`,
        ...contradictions.map(c => `- ${c.topic}: ${c.description}. Guidance: ${c.resolutionGuidance}`),
      ].join('\n')
    : '';

  return `
EVALUATE THIS RELEASE CANDIDATE ACCORDING TO RELEASETRACE STANDARDS:

=== CURRENT DEPLOYMENT EVIDENCE (REALITY) ===
${currentEvidence}

=== DETERMINISTIC SAFETY RULES ===
${deterministicRulesSection}

=== HISTORICAL PERSISTENT MEMORY ===
${historicalSection}

${envMismatchSection ? `=== ENVIRONMENT DIVERGENCE ===\n${envMismatchSection}\n` : ''}
${contradictionSection ? `=== MEMORY CONTRADICTIONS ===\n${contradictionSection}\n` : ''}

Generate structured JSON output with the exact fields:
{
  "summary": "<Concise executive summary of release risk>",
  "overallRisk": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "abstentionState": "${shouldAbstain ? (qualifiedMemories.length === 0 ? 'ABSTAINED_NO_RELEVANT_MEMORIES' : 'ABSTAINED_WEAK_RECALL') : 'ACCUMULATED_EXPERIENCE'}",
  "abstentionReason": ${shouldAbstain ? JSON.stringify(abstentionReason) : "undefined"},
  "recalledMemoriesUsed": [
    ${shouldAbstain ? '' : qualifiedMemories.map(qm => `{
      "memoryId": "${qm.memory.id}",
      "confirmedRootCause": ${JSON.stringify(qm.memory.confirmedRootCause)},
      "verifiedMitigation": ${JSON.stringify(qm.memory.verifiedMitigation)},
      "historicalConditions": "${qm.memory.environment.runtime}, ${qm.memory.environment.database.type} v${qm.memory.environment.database.version}, pool: ${qm.memory.environment.database.poolSize ?? 'default'}",
      "relevanceScore": ${qm.finalRelevanceScore},
      "environmentMatchScore": ${qm.environmentMatchScore},
      "confirmedBy": "${qm.memory.confirmation.confirmedBy}",
      "confirmedAt": "${qm.memory.confirmation.confirmedAt}"
    }`).join(',')}
  ],
  "environmentMismatchAnalysis": ${environmentComparison ? JSON.stringify(environmentComparison.explanation) : "undefined"},
  "contradictionsIdentified": [
    ${contradictions.map(c => `{
      "topic": "${c.topic}",
      "description": ${JSON.stringify(c.description)},
      "resolutionGuidance": ${JSON.stringify(c.resolutionGuidance)}
    }`).join(',')}
  ],
  "currentEvidenceObservations": [
    "<Observation about current git diff or schema change>",
    "<Observation about telemetry or runtime readiness>"
  ],
  "recommendations": [
    {
      "action": "<Specific actionable recommendation>",
      "priority": "IMMEDIATE" | "PRE_DEPLOY" | "MONITOR",
      "rationale": "<Detailed rationale>",
      "source": "VERIFIED_MEMORY" | "DETERMINISTIC_RULE" | "CURRENT_EVIDENCE_ANALYSIS",
      "memoryReference": {
        "memoryId": "<id>",
        "confirmedBy": "<engineer>",
        "confirmedAt": "<iso-date>"
      },
      "conditionNotice": "<Historical conditions notice>",
      "divergenceWarning": "<Warning if environment differs>"
    }
  ]
}
`;
}
