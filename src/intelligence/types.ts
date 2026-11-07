/**
 * ReleaseTrace Intelligence System - Core Domain Types and Shared Contracts
 * 
 * Strict contracts separating current deployment evidence from historical memories,
 * enforcing engineer confirmation, environment comparison, and deterministic safeguards.
 */

export interface DatabaseConfig {
  type: string;
  version: string;
  poolSize?: number;
  maxIdleTimeoutMs?: number;
  statementTimeoutMs?: number;
}

export interface InfrastructureConfig {
  provider: string;
  region: string;
  replicas: number;
  cpuLimit?: string;
  memoryLimit?: string;
}

export interface EnvironmentConfig {
  runtime: string; // e.g. "nodejs@20.11.0"
  database: DatabaseConfig;
  infrastructure: InfrastructureConfig;
  featureFlags: Record<string, boolean | string>;
  envVariables: Record<string, string>;
  dependencies: Record<string, string>;
}

export interface GitDiffSummary {
  filesChanged: string[];
  additions: number;
  deletions: number;
  hasDatabaseMigrations: boolean;
  migrationDetails?: string;
}

export interface TelemetrySnapshot {
  errorRate: number;
  p95LatencyMs: number;
  cpuUtilization: number;
  memoryUtilization: number;
  connectionPoolSaturation: number;
}

export interface DeploymentContext {
  deploymentId: string;
  projectId: string;
  service: string;
  timestamp: string;
  commitHash: string;
  branch: string;
  gitDiffSummary: GitDiffSummary;
  environment: EnvironmentConfig;
  targetEnvironment: 'production' | 'staging' | 'canary';
  telemetrySnapshot?: TelemetrySnapshot;
  environmentNotes?: string;
}

export interface FailureIncident {
  deploymentId: string;
  projectId: string;
  service: string;
  failedAt: string;
  failureType: string;
  errorSignatures: string[];
  logsSample: string[];
  metricsAtFailure?: Record<string, number>;
}

export interface EngineerConfirmation {
  confirmedBy: string; // Engineer email/identifier
  confirmedAt: string; // ISO-8601 timestamp
  isConfirmed: true;   // Must be explicitly true. Unconfirmed cannot be retained.
  confirmationMethod: 'manual_investigation' | 'postmortem' | 'runbook_resolution';
  verificationEvidence: string; // Concrete evidence cited by the engineer
  notes?: string;
}

export interface VerifiedEngineeringMemory {
  id: string;
  projectId: string;
  deploymentId: string;
  service: string;
  createdAt: string;
  environment: EnvironmentConfig;
  failureContext: {
    failureType: string;
    symptoms: string[];
    errorSignatures: string[];
    logsSample: string[];
  };
  confirmedRootCause: string;
  verifiedMitigation: string;
  outcome: 'resolved' | 'mitigated' | 'rolled_back';
  confirmation: EngineerConfirmation;
  tags: string[];
}

export interface EnvironmentDifference {
  category: 'runtime' | 'database' | 'infrastructure' | 'featureFlags' | 'dependencies';
  parameter: string;
  historicalValue: unknown;
  currentValue: unknown;
  severity: 'CRITICAL_MISMATCH' | 'MODERATE_DIVERGENCE' | 'INFORMATIONAL';
  impactExplanation: string;
}

export interface EnvironmentComparisonResult {
  isMatch: boolean;
  matchScore: number; // 0.0 (total mismatch) to 1.0 (identical)
  identicalKeys: string[];
  differingKeys: string[];
  differences: EnvironmentDifference[];
  explanation: string;
}

export interface Contradiction {
  id: string;
  topic: string;
  contradictionType: 'OPPOSING_MITIGATIONS' | 'CONFLICTING_ROOT_CAUSES' | 'ENVIRONMENT_CONDITIONAL_CONFLICT';
  memoryA: {
    id: string;
    rootCause: string;
    mitigation: string;
    conditions: string;
  };
  memoryB: {
    id: string;
    rootCause: string;
    mitigation: string;
    conditions: string;
  };
  description: string;
  resolutionGuidance: string;
}

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface DeterministicRuleViolation {
  ruleId: string;
  ruleName: string;
  severity: RiskLevel;
  description: string;
  remediation: string;
  evidence: string;
}

export interface RecalledMemoryReference {
  memoryId: string;
  confirmedRootCause: string;
  verifiedMitigation: string;
  historicalConditions: string;
  relevanceScore: number;
  environmentMatchScore: number;
  confirmedBy: string;
  confirmedAt: string;
}

export interface Recommendation {
  action: string;
  priority: 'IMMEDIATE' | 'PRE_DEPLOY' | 'MONITOR';
  rationale: string;
  source: 'VERIFIED_MEMORY' | 'DETERMINISTIC_RULE' | 'CURRENT_EVIDENCE_ANALYSIS';
  memoryReference?: {
    memoryId: string;
    confirmedBy: string;
    confirmedAt: string;
  };
  conditionNotice?: string;
  divergenceWarning?: string;
}

export type MemoryAssessmentState =
  | 'ACCUMULATED_EXPERIENCE'
  | 'ABSTAINED_NO_RELEVANT_MEMORIES'
  | 'ABSTAINED_WEAK_RECALL';

export interface ReleaseAssessment {
  deploymentId: string;
  projectId: string;
  assessedAt: string;
  overallRisk: RiskLevel;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  memoryAssessmentState: MemoryAssessmentState;
  ruleViolations: DeterministicRuleViolation[];
  currentEvidenceSummary: {
    gitChanges: string;
    telemetryStatus: string;
    criticalSignals: string[];
  };
  recalledMemories: RecalledMemoryReference[];
  environmentComparison?: EnvironmentComparisonResult;
  hasContradictions: boolean;
  contradictions: Contradiction[];
  recommendations: Recommendation[];
  abstentionReason?: string;
  provenance: {
    llmModel: string;
    hindsightBankId: string;
    memoryEngineVersion: string;
    memoryCountConsulted: number;
    timestamp: string;
  };
}
