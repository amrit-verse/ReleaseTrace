import { z } from "zod";

/**
 * Risk Categories evaluated deterministically by the Risk Engine.
 */
export const RiskCategoryEnum = z.enum([
  "HIGH_RISK",
  "REVIEW_REQUIRED",
  "LOW_KNOWN_RISK",
  "INSUFFICIENT_EVIDENCE",
]);
export type RiskCategory = z.infer<typeof RiskCategoryEnum>;

/**
 * Deployment environment categories.
 */
export const EnvironmentTypeEnum = z.enum([
  "production",
  "preview",
  "staging",
  "development",
]);
export type EnvironmentType = z.infer<typeof EnvironmentTypeEnum>;

/**
 * Normalized Deployment Status.
 */
export const DeploymentStatusEnum = z.enum([
  "QUEUED",
  "BUILDING",
  "DEPLOYED",
  "FAILED",
  "CANCELED",
]);
export type DeploymentStatus = z.infer<typeof DeploymentStatusEnum>;

/**
 * Verified Memory Retention status.
 */
export const RetentionStatusEnum = z.enum([
  "PENDING_VERIFICATION",
  "RETAINED",
  "SKIPPED_SPECULATIVE",
  "REJECTED",
]);
export type RetentionStatus = z.infer<typeof RetentionStatusEnum>;

// ============================================================================
// 1. DeploymentEvidence
// Grounded facts extracted directly from Git, CI/CD, Build, Test, and DB checks.
// Current evidence is NEVER mixed with historical memory.
// ============================================================================
export const MigrationEvidenceSchema = z.object({
  hasPendingMigrations: z.boolean(),
  migrationFileCount: z.number().int().nonnegative(),
  migrationNames: z.array(z.string()),
  appliedMigrationsCount: z.number().int().nonnegative().optional(),
  schemaHash: z.string().optional(),
  sqlChecksums: z.record(z.string()).optional(),
  validationError: z.string().nullable().optional(),
});
export type MigrationEvidence = z.infer<typeof MigrationEvidenceSchema>;

export const DeploymentEvidenceSchema = z.object({
  commitSha: z.string().min(7),
  branch: z.string().min(1),
  commitMessage: z.string(),
  author: z.string(),
  repository: z.string(),
  framework: z.string().default("nextjs"),
  runtimeVersion: z.string().default("nodejs-22"),
  buildPassed: z.boolean(),
  testsPassed: z.boolean(),
  testSummary: z
    .object({
      total: z.number().int().nonnegative(),
      passed: z.number().int().nonnegative(),
      failed: z.number().int().nonnegative(),
      skipped: z.number().int().nonnegative(),
    })
    .optional(),
  migrationEvidence: MigrationEvidenceSchema.optional(),
  changedFiles: z.array(z.string()).default([]),
  environment: EnvironmentTypeEnum,
  vercelDeploymentId: z.string().optional(),
  vercelDeploymentUrl: z.string().optional(),
  rawBuildLogsExcerpt: z.string().optional(),
  collectedAt: z.string().datetime(),
});
export type DeploymentEvidence = z.infer<typeof DeploymentEvidenceSchema>;

// ============================================================================
// 2. DeploymentEvent
// Standardized payload received from signed webhooks (GitHub Actions, Vercel).
// ============================================================================
export const DeploymentEventSchema = z.object({
  eventId: z.string().min(1),
  provider: z.enum(["github_actions", "vercel", "manual_rehearsal"]),
  projectId: z.string().min(1),
  projectName: z.string(),
  eventType: z.enum(["deployment_started", "deployment_completed", "deployment_failed"]),
  timestamp: z.string().datetime(),
  evidence: DeploymentEvidenceSchema,
  signature: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
});
export type DeploymentEvent = z.infer<typeof DeploymentEventSchema>;

// ============================================================================
// 3. DeploymentMemoryCase
// Structured historical unit of engineering experience retained in Hindsight.
// Retained ONLY after human engineer confirmation.
// ============================================================================
export const DeploymentMemoryCaseSchema = z.object({
  id: z.string().uuid().optional(),
  externalMemoryId: z.string().optional(),
  bankId: z.string().min(1),
  projectId: z.string().min(1),
  projectName: z.string(),
  commitSha: z.string().min(7),
  title: z.string().min(5),
  failureSymptoms: z.array(z.string()),
  environment: z.object({
    type: EnvironmentTypeEnum,
    runtimeVersion: z.string(),
    framework: z.string(),
    databaseVersion: z.string().optional(),
  }),
  migrationChanges: z.array(z.string()).default([]),
  failedApproaches: z.array(z.string()).default([]),
  verifiedRootCause: z.string().min(5),
  successfulResolution: z.string().min(5),
  evidenceReferences: z.array(z.string()).default([]),
  outcome: z.enum(["RESOLVED", "ROLLED_BACK", "HOTFIXED", "ABORTED"]),
  verifiedBy: z.string().min(1),
  verificationNotes: z.string(),
  tags: z.array(z.string()).default([]),
  occurredAt: z.string().datetime(),
  retainedAt: z.string().datetime(),
});
export type DeploymentMemoryCase = z.infer<typeof DeploymentMemoryCaseSchema>;

// ============================================================================
// 4. MemoryRecallResult
// Semantic recall outcome from Hindsight Cloud.
// ============================================================================
export const RecalledFactSchema = z.object({
  memoryId: z.string(),
  text: z.string(),
  type: z.string().optional(),
  relevanceScore: z.number().min(0).max(1).optional(),
  context: z.string().optional(),
  entities: z.array(z.string()).optional(),
  occurredAt: z.string().optional(),
  tags: z.array(z.string()).optional(),
  sourceMemoryCase: DeploymentMemoryCaseSchema.optional(),
});
export type RecalledFact = z.infer<typeof RecalledFactSchema>;

export const MemoryRecallResultSchema = z.object({
  bankId: z.string(),
  query: z.string(),
  isEmpty: z.boolean(),
  recalledCases: z.array(RecalledFactSchema),
  trace: z.record(z.unknown()).optional(),
  provenance: z.object({
    totalMemoriesBank: z.number().int().nonnegative().optional(),
    modelUsed: z.string().optional(),
    durationMs: z.number().nonnegative().optional(),
  }).optional(),
  hasContradictions: z.boolean().default(false),
  contradictionNotes: z.string().optional(),
});
export type MemoryRecallResult = z.infer<typeof MemoryRecallResultSchema>;

// ============================================================================
// 5. EnvironmentComparison
// Explicit diff between historical memory and current release environment.
// ============================================================================
export const EnvironmentComparisonSchema = z.object({
  isExactMatch: z.boolean(),
  currentEnvironment: z.object({
    type: EnvironmentTypeEnum,
    runtimeVersion: z.string(),
    framework: z.string(),
  }),
  historicalEnvironment: z.object({
    type: EnvironmentTypeEnum,
    runtimeVersion: z.string(),
    framework: z.string(),
  }).optional(),
  mismatches: z.array(
    z.object({
      field: z.string(),
      currentValue: z.string(),
      historicalValue: z.string(),
      severity: z.enum(["CRITICAL", "WARNING", "INFO"]),
      riskImplication: z.string(),
    })
  ),
  compatibilityAssessment: z.string(),
});
export type EnvironmentComparison = z.infer<typeof EnvironmentComparisonSchema>;

// ============================================================================
// 6. RiskFinding
// Grounded deterministic risk finding citing current evidence and memory IDs.
// ============================================================================
export const RiskFindingSchema = z.object({
  id: z.string().min(1),
  code: z.string(),
  category: RiskCategoryEnum,
  title: z.string(),
  description: z.string(),
  citedEvidenceKeys: z.array(z.string()),
  citedMemoryIds: z.array(z.string()).default([]),
  actionableRemediation: z.string(),
  confidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
});
export type RiskFinding = z.infer<typeof RiskFindingSchema>;

// ============================================================================
// 7. ReleaseAssessment
// Complete evaluation output produced for the engineer.
// ============================================================================
export const ReleaseAssessmentSchema = z.object({
  id: z.string().uuid(),
  deploymentId: z.string(),
  projectId: z.string(),
  overallCategory: RiskCategoryEnum,
  summary: z.string(),
  findings: z.array(RiskFindingSchema),
  environmentComparison: EnvironmentComparisonSchema,
  recalledMemories: MemoryRecallResultSchema,
  groundedExplanation: z.string(),
  recommendedAction: z.enum(["PROCEED", "HOLD_FOR_MIGRATION", "ABORT", "INVESTIGATE"]),
  checklist: z.array(
    z.object({
      item: z.string(),
      completed: z.boolean(),
      required: z.boolean(),
    })
  ),
  llmMetadata: z.object({
    provider: z.literal("groq"),
    model: z.string(),
    durationMs: z.number(),
    validatedWithZod: z.boolean(),
    fallbackUsed: z.boolean(),
  }),
  createdAt: z.string().datetime(),
});
export type ReleaseAssessment = z.infer<typeof ReleaseAssessmentSchema>;

// ============================================================================
// 8. VerifiedResolution
// Human engineer confirmation required before saving to Hindsight.
// ============================================================================
export const VerifiedResolutionSchema = z.object({
  id: z.string().uuid().optional(),
  assessmentId: z.string().uuid(),
  deploymentId: z.string(),
  projectId: z.string(),
  engineerName: z.string().min(1),
  engineerEmail: z.string().email().optional(),
  confirmedRootCause: z.string().min(5),
  appliedFix: z.string().min(5),
  preventionGuideline: z.string().min(5),
  outcome: z.enum(["SUCCESSFUL_RELEASE", "HOTFIX_DEPLOYED", "ROLLBACK_EXECUTED", "MIGRATION_REPAIRED"]),
  retainToHindsight: z.boolean(),
  retentionTags: z.array(z.string()).default([]),
  resolvedAt: z.string().datetime(),
});
export type VerifiedResolution = z.infer<typeof VerifiedResolutionSchema>;
