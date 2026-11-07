import { describe, it, expect } from "vitest";
import {
  DeploymentEvidenceSchema,
  DeploymentEventSchema,
  DeploymentMemoryCaseSchema,
  ReleaseAssessmentSchema,
  VerifiedResolutionSchema,
} from "./index";

describe("Shared Contracts & Zod Schemas", () => {
  it("validates DeploymentEvidenceSchema correctly", () => {
    const validEvidence = {
      commitSha: "a1b2c3d4e5",
      branch: "main",
      commitMessage: "feat: add user billing migration",
      author: "alex",
      repository: "releasetrace/web",
      framework: "nextjs",
      runtimeVersion: "nodejs-22",
      buildPassed: true,
      testsPassed: true,
      testSummary: { total: 42, passed: 42, failed: 0, skipped: 0 },
      migrationEvidence: {
        hasPendingMigrations: true,
        migrationFileCount: 1,
        migrationNames: ["20261106_add_billing_table"],
      },
      changedFiles: ["prisma/schema.prisma", "prisma/migrations/20261106_add_billing_table/migration.sql"],
      environment: "production",
      collectedAt: new Date().toISOString(),
    };

    const parsed = DeploymentEvidenceSchema.parse(validEvidence);
    expect(parsed.commitSha).toBe("a1b2c3d4e5");
    expect(parsed.migrationEvidence?.hasPendingMigrations).toBe(true);
  });

  it("validates DeploymentMemoryCaseSchema and enforces structured memory", () => {
    const validCase = {
      bankId: "proj_releasetrace_bank",
      projectId: "proj_01",
      projectName: "ReleaseTrace Web",
      commitSha: "abc1234567",
      title: "Missing Prisma migration applied in production deployment",
      failureSymptoms: ["PrismaClientKnownRequestError: Table 'billing' does not exist"],
      environment: {
        type: "production",
        runtimeVersion: "nodejs-22",
        framework: "nextjs@15",
      },
      migrationChanges: ["Added BillingRecord model to Prisma schema"],
      failedApproaches: ["Retrying deployment without migration deploy step"],
      verifiedRootCause: "prisma migrate deploy was omitted from the Vercel build script",
      successfulResolution: "Added prisma migrate deploy before next build in package.json build script",
      evidenceReferences: ["Vercel log: P2021 table does not exist"],
      outcome: "RESOLVED",
      verifiedBy: "Senior DevOps Lead",
      verificationNotes: "Confirmed in production post-deployment check",
      tags: ["prisma", "postgres", "missing-migration"],
      occurredAt: new Date().toISOString(),
      retainedAt: new Date().toISOString(),
    };

    const parsed = DeploymentMemoryCaseSchema.parse(validCase);
    expect(parsed.outcome).toBe("RESOLVED");
    expect(parsed.tags).toContain("prisma");
  });

  it("validates ReleaseAssessmentSchema with all required sub-contracts", () => {
    const validAssessment = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      deploymentId: "dep_99",
      projectId: "proj_01",
      overallCategory: "HIGH_RISK",
      summary: "Deployment has pending Prisma migration without execution proof.",
      findings: [
        {
          id: "rf_01",
          code: "MIGRATION_PENDING_UNVERIFIED",
          category: "HIGH_RISK",
          title: "Pending database migration missing verification",
          description: "A migration file exists in the commit but no deployment log confirms application.",
          citedEvidenceKeys: ["migrationEvidence.hasPendingMigrations"],
          citedMemoryIds: ["mem_prev_incident_01"],
          actionableRemediation: "Run prisma migrate deploy before proceeding.",
          confidence: "HIGH",
        },
      ],
      environmentComparison: {
        isExactMatch: true,
        currentEnvironment: {
          type: "production",
          runtimeVersion: "nodejs-22",
          framework: "nextjs",
        },
        mismatches: [],
        compatibilityAssessment: "Exact environment match with previous production incident.",
      },
      recalledMemories: {
        bankId: "proj_releasetrace_bank",
        query: "Prisma database migration pending execution",
        isEmpty: false,
        recalledCases: [
          {
            memoryId: "mem_prev_incident_01",
            text: "Missing migration deployment caused runtime crash P2021",
            relevanceScore: 0.94,
          },
        ],
        hasContradictions: false,
      },
      groundedExplanation: "Grounded in historical incident mem_prev_incident_01 where similar migration caused downtime.",
      recommendedAction: "HOLD_FOR_MIGRATION",
      checklist: [
        { item: "Run prisma migrate deploy in staging", completed: false, required: true },
        { item: "Check table schema exists in Neon", completed: false, required: true },
      ],
      llmMetadata: {
        provider: "groq",
        model: "openai/gpt-oss-120b",
        durationMs: 420,
        validatedWithZod: true,
        fallbackUsed: false,
      },
      createdAt: new Date().toISOString(),
    };

    const parsed = ReleaseAssessmentSchema.parse(validAssessment);
    expect(parsed.overallCategory).toBe("HIGH_RISK");
    expect(parsed.findings.length).toBe(1);
  });

  it("validates DeploymentEventSchema correctly", () => {
    const validEvent = {
      eventId: "evt_123",
      provider: "github_actions",
      projectId: "proj_01",
      projectName: "ReleaseTrace",
      eventType: "deployment_started",
      timestamp: new Date().toISOString(),
      evidence: {
        commitSha: "a1b2c3d4e5",
        branch: "main",
        commitMessage: "feat: deploy",
        author: "alex",
        repository: "releasetrace/web",
        framework: "nextjs",
        runtimeVersion: "nodejs-22",
        buildPassed: true,
        testsPassed: true,
        environment: "production",
        collectedAt: new Date().toISOString(),
      },
    };

    const parsed = DeploymentEventSchema.parse(validEvent);
    expect(parsed.eventId).toBe("evt_123");
    expect(parsed.provider).toBe("github_actions");
  });

  it("validates VerifiedResolutionSchema correctly", () => {
    const validResolution = {
      assessmentId: "123e4567-e89b-12d3-a456-426614174000",
      deploymentId: "dep_99",
      projectId: "proj_01",
      engineerName: "Marcus Vance",
      engineerEmail: "marcus.vance@engineering.internal",
      confirmedRootCause: "Missing statement timeout in migration lock",
      appliedFix: "Added lock_timeout guard before DDL execution",
      preventionGuideline: "Always set lock_timeout on production migrations",
      outcome: "SUCCESSFUL_RELEASE",
      retainToHindsight: true,
      resolvedAt: new Date().toISOString(),
    };

    const parsed = VerifiedResolutionSchema.parse(validResolution);
    expect(parsed.engineerName).toBe("Marcus Vance");
    expect(parsed.outcome).toBe("SUCCESSFUL_RELEASE");
  });
});
