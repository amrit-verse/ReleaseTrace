/**
 * ReleaseTrace Shared TypeScript Types & Domain Contracts
 * Single source of truth for deployments, assessments, memories, and learning lab.
 */

export type RiskClassification =
  | "CRITICAL"
  | "HIGH_RISK"
  | "ELEVATED"
  | "NOMINAL"
  | "VERIFIED";

export type DeploymentStatus =
  | "passed"
  | "at_risk"
  | "blocked"
  | "rolled_back"
  | "in_progress"
  | "evaluating";

export type EnvironmentType =
  | "production"
  | "staging"
  | "canary"
  | "eu-central"
  | "us-east-1"
  | "apac-south";

export type EvidenceSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type EvidenceCategory =
  | "SCHEMA_MIGRATION"
  | "INFRASTRUCTURE_DRIFT"
  | "NETWORK_CONFIG"
  | "DEPENDENCY_VULNERABILITY"
  | "CONCURRENCY_BURST"
  | "RESOURCE_QUOTA"
  | "OBSERVABILITY_GAP";

export interface DeploymentEvidence {
  id: string;
  category: EvidenceCategory;
  finding: string;
  severity: EvidenceSeverity;
  rawDetails: string;
  fileReference?: string;
  impactEstimate: string;
  telemetryMetric?: {
    name: string;
    before: string;
    after: string;
    deviation: string;
  };
}

export interface EnvironmentSpec {
  name: string;
  region: string;
  replicaCount: number;
  nodeKernel: string;
  dbEngine: string;
  dbEngineVersion: string;
  tlsVersion: string;
  cacheTier: string;
  maxConnections: number;
  connectionTimeoutMs: number;
  ingressController: string;
}

export interface EnvironmentMismatch {
  field: string;
  originalValue: string;
  targetValue: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  driftImpact: string;
  remediationRecommendation: string;
}

export interface EnvironmentComparison {
  originalEnv: EnvironmentSpec;
  targetEnv: EnvironmentSpec;
  mismatches: EnvironmentMismatch[];
  driftScore: number; // 0 - 100
}

export interface MemoryProvenance {
  gitCommit: string;
  incidentTicket: string;
  runbookUrl: string;
  postMortemAuthor: string;
  signoffEngineer: string;
  timestamp: string;
  serviceVersion: string;
  outageMinutes?: number;
}

export interface HindsightMemory {
  id: string;
  title: string;
  incidentDate: string;
  service: string;
  environment: string;
  severity: "SEV-1" | "SEV-2" | "SEV-3";
  symptoms: string[];
  rootCause: string;
  failedApproaches: string[];
  resolution: string;
  provenance: MemoryProvenance;
  tags: string[];
  recalledCount: number;
  preventedIncidentsCount: number;
  source: "HINDSIGHT_API" | "LOCAL_ENGINE" | "FIXTURE";
  similarityScore?: number; // When recalled in context (0.0 to 1.0)
  relevanceWhy?: string;
}

export interface EngineerVerificationAction {
  id: string;
  label: string;
  description: string;
  status: "PENDING" | "PASSED" | "OVERRIDDEN" | "FAILED";
  required: boolean;
  verifiedBy?: string;
  timestamp?: string;
  notes?: string;
  category: "DRIFT" | "LOAD_VERIFY" | "ROLLBACK_PREP" | "MANUAL_APPROVAL";
}

export interface DeploymentTelemetry {
  buildTimeSec: number;
  bundleSizeDeltaKb: number;
  testCoveragePct: number;
  databaseMigrations: number;
  changedFilesCount: number;
  addedLines: number;
  deletedLines: number;
  cpuQuotaMilli: number;
  memoryQuotaMb: number;
  p99LatencyMsTarget: number;
}

export interface Deployment {
  id: string;
  service: string;
  version: string;
  commitHash: string;
  commitMessage: string;
  author: {
    name: string;
    email: string;
    avatar?: string;
  };
  timestamp: string;
  environment: EnvironmentType;
  targetCluster: string;
  status: DeploymentStatus;
  riskClassification: RiskClassification;
  riskScore: number; // 0 - 100
  durationSec: number;
  branch: string;
  pullRequest: {
    number: number;
    title: string;
    url: string;
  };
  telemetry: DeploymentTelemetry;
  environmentComparison: EnvironmentComparison;
  evidence: DeploymentEvidence[];
  recalledMemories: HindsightMemory[];
  recommendationReasons: string[];
  verificationActions: EngineerVerificationAction[];
}

export interface RecurringFailureCategory {
  id: string;
  category: string;
  description: string;
  incidentCount: number;
  blastRadius: "HIGH" | "MEDIUM" | "LOW";
  averageRecoveryMinutes: number;
  trend: "INCREASING" | "DECREASING" | "STABLE";
  lastOccurred: string;
  associatedMemoriesCount: number;
  topAffectedServices: string[];
}

export interface LearningLabScenario {
  id: string;
  title: string;
  service: string;
  shortDescription: string;
  vulnerabilityPattern: string;
  commitHash: string;
  codeDiff: {
    filename: string;
    diffSnippet: string;
  };
  environmentSetup: {
    testEnv: string;
    targetEnv: string;
    discrepancy: string;
  };
  coldRun: {
    status: DeploymentStatus;
    riskClassification: RiskClassification;
    riskScore: number;
    explanation: string;
    recalledMemoriesCount: number;
    warningFlagged: boolean;
    productionOutcome: string;
  };
  retainedIncident: {
    incidentTicket: string;
    title: string;
    rootCause: string;
    symptoms: string[];
    failedApproaches: string[];
    resolution: string;
    provenanceAuthor: string;
  };
  warmRun: {
    status: DeploymentStatus;
    riskClassification: RiskClassification;
    riskScore: number;
    explanation: string;
    recalledMemoryId: string;
    similarityScore: number;
    proactiveChecklist: string[];
    preventedBlastRadius: string;
  };
}

export interface IntegrationConfig {
  id: string;
  name: string;
  provider:
    | "hindsight"
    | "github"
    | "gitlab"
    | "argocd"
    | "kubernetes"
    | "datadog"
    | "pagerduty"
    | "slack";
  category: "MEMORY_ENGINE" | "CI_CD" | "INFRASTRUCTURE" | "MONITORING" | "ALERTING";
  description: string;
  status:
    | "CONNECTED"
    | "DEGRADED"
    | "DISCONNECTED"
    | "SYNCING"
    | "MOCK_MODE"
    | "CONFIGURED"
    | "UNAVAILABLE"
    | "AUTHENTICATION_FAILED"
    | "NOT_CONFIGURED";
  endpoint: string;
  lastHeartbeat: string;
  latencyMs: number;
  syncedEventsCount: number;
  credentialsMasked: string;
  syncIntervalSec: number;
  enabledCapabilities: string[];
}

export interface WorkspaceSettings {
  workspaceName: string;
  riskToleranceThreshold: number; // e.g., 65
  autoBlockCriticalRisk: boolean;
  requireEngineerSignoffOnDrift: boolean;
  hindsightApiEndpoint: string;
  hindsightClusterId: string;
  memoryRetentionDays: number;
  telemetryLogRetentionDays: number;
  slackWebhookUrl: string;
  datadogApiKeyMasked: string;
  pagerdutyServiceKeyMasked: string;
}
