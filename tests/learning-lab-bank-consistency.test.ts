import { describe, it, expect, beforeEach } from "vitest";
import { ReleaseTraceIntelligenceEngine } from "@/intelligence/engine/intelligence-engine";
import { ProjectMemoryBankManager } from "@/intelligence/hindsight/bank-manager";
import { HindsightAdapter } from "@/intelligence/hindsight/adapter";
import type { VerifiedEngineeringMemoryInput } from "@/intelligence/memory/schema";
import type { DeploymentContext } from "@/intelligence/types";

describe("P0: Hindsight Bank Consistency & Retention-Recall Loop", () => {
  let adapter: HindsightAdapter;
  let bankManager: ProjectMemoryBankManager;
  let engine: ReleaseTraceIntelligenceEngine;

  const projectId = "auth-gateway";
  const expectedBankId = "rt-auth-gateway";

  beforeEach(() => {
    HindsightAdapter.resetInstance();
    adapter = HindsightAdapter.getInstance({ useMockTransport: true });
    bankManager = new ProjectMemoryBankManager(adapter);
    engine = new ReleaseTraceIntelligenceEngine({
      hindsightAdapter: adapter,
      relevanceThreshold: 0.4,
    });

    // Clean bank state
    adapter.clearMockBank(expectedBankId);
  });

  it("canonical project identity generates exactly one stable bank ID exclusively through ProjectMemoryBankManager", () => {
    const bankId = bankManager.getProjectBankId(projectId);
    expect(bankId).toBe(expectedBankId);

    // Engine's bank manager generates the exact same bank ID
    const engineBankId = engine.getBankManager().getProjectBankId(projectId);
    expect(engineBankId).toBe(expectedBankId);
  });

  it("retains verified incident memory via ExperienceRetentionWorkflow and proves next assessment recalls from the exact same bank", async () => {
    // 1. Initial Cold Assessment: bank is empty, no memories recalled
    const coldDeployment: DeploymentContext = {
      deploymentId: "dep-cold-001",
      projectId,
      service: "auth-gateway",
      timestamp: new Date().toISOString(),
      commitHash: "e491bc8",
      branch: "main",
      gitDiffSummary: {
        filesChanged: ["prisma/migrations/add_mfa.sql"],
        additions: 10,
        deletions: 0,
        hasDatabaseMigrations: true,
        migrationDetails: "ALTER TABLE users ADD COLUMN mfa_enforced_at TIMESTAMP NOT NULL DEFAULT NOW();",
      },
      environment: {
        runtime: "nodejs@22.0.0",
        database: {
          type: "postgresql",
          version: "15.0",
          poolSize: 100,
        },
        infrastructure: {
          provider: "aws",
          region: "us-east-1",
          replicas: 1,
        },
        featureFlags: {},
        envVariables: {},
        dependencies: {},
      },
      targetEnvironment: "production",
      environmentNotes: "Staging RDS test pass",
    };

    const coldAssessment = await engine.assessDeployment(coldDeployment);
    expect(coldAssessment.recalledMemories.length).toBe(0);
    expect(coldAssessment.memoryAssessmentState).toBe("ABSTAINED_NO_RELEVANT_MEMORIES");

    // 2. Engineer confirms incident and retains experience into Hindsight
    const incidentMemoryInput: VerifiedEngineeringMemoryInput = {
      id: "mem-auth-gateway-table-lock",
      projectId,
      deploymentId: "dep-cold-001",
      service: "auth-gateway",
      createdAt: new Date().toISOString(),
      environment: {
        runtime: "nodejs@20.11.0",
        database: {
          type: "postgresql",
          version: "15.4",
          poolSize: 500,
          statementTimeoutMs: 600000,
        },
        infrastructure: {
          provider: "aws",
          region: "us-east-1",
          replicas: 2,
        },
        featureFlags: {},
        envVariables: {},
        dependencies: {},
      },
      failureContext: {
        failureType: "Database Migration Lock: AccessExclusiveLock table rewrite timeout",
        symptoms: [
          "Exclusive lock held on users table for > 180s",
          "504 Gateway Timeouts reached 98.4%",
          "Connection pool exhaustion 500/500",
        ],
        errorSignatures: ["ALTER TABLE", "users", "security_badge_id", "UUID"],
        logsSample: ["ERROR: canceling statement due to statement timeout"],
      },
      confirmedRootCause:
        "Adding non-null column with volatile default NOW() required full table rewrite on 49.8M rows under AccessExclusiveLock.",
      verifiedMitigation:
        "Split into 3 steps: add nullable column, backfill asynchronously in batches, then add NOT NULL constraint concurrently.",
      outcome: "resolved",
      confirmation: {
        confirmedBy: "sarah.chen@engineering.internal",
        confirmedAt: new Date().toISOString(),
        isConfirmed: true,
        confirmationMethod: "manual_investigation",
        verificationEvidence: "Forensic audit of Postgres pg_locks during migration lock queue cascade.",
        notes: "Verified by Staff SRE in production post-mortem",
      },
      tags: ["auth-gateway", "postgres", "migration-lock", "releasetrace"],
    };

    const retentionWorkflow = engine.getRetentionWorkflow();
    const retainResult = await retentionWorkflow.retainVerifiedExperience(incidentMemoryInput);

    expect(retainResult.success).toBe(true);
    expect(retainResult.bankId).toBe(expectedBankId);
    expect(retainResult.documentId).toBe(`case-${projectId}-dep-cold-001-mem-auth-gateway-table-lock`);

    // 3. Similar Subsequent Deployment (Warm Assessment) on the SAME project bank
    const warmDeployment: DeploymentContext = {
      deploymentId: "dep-warm-002",
      projectId, // exact same canonical projectId
      service: "auth-gateway",
      timestamp: new Date().toISOString(),
      commitHash: "e491bc8-warm",
      branch: "main",
      gitDiffSummary: {
        filesChanged: ["prisma/migrations/add_security_token.sql"],
        additions: 12,
        deletions: 0,
        hasDatabaseMigrations: true,
        migrationDetails: "ALTER TABLE users ADD COLUMN security_badge_id UUID NOT NULL DEFAULT gen_random_uuid();",
      },
      environment: {
        runtime: "nodejs@22.0.0",
        database: {
          type: "postgresql",
          version: "15.6",
          poolSize: 4000,
          statementTimeoutMs: 30000,
        },
        infrastructure: {
          provider: "aws",
          region: "us-east-1",
          replicas: 2,
        },
        featureFlags: {},
        envVariables: {},
        dependencies: {},
      },
      targetEnvironment: "production",
      environmentNotes: "Production Aurora cluster with 49M rows",
    };

    const warmAssessment = await engine.assessDeployment(warmDeployment);

    // Prove that the warm assessment recalled the memory retained from the same bank
    expect(warmAssessment.memoryAssessmentState).toBe("ACCUMULATED_EXPERIENCE");
    expect(warmAssessment.recalledMemories.length).toBeGreaterThanOrEqual(1);

    const citedMemory = warmAssessment.recalledMemories.find(
      (c) => c.memoryId === "mem-auth-gateway-table-lock"
    );
    expect(citedMemory).toBeDefined();

    // Verify recommendations cite the verified mitigation
    const hasMitigationCited = warmAssessment.recommendations.some(
      (rec) =>
        rec.rationale?.includes("Split into 3 steps") ||
        rec.action?.includes("Split into 3 steps") ||
        rec.action?.includes("confirmed historical mitigation") ||
        rec.source === "VERIFIED_MEMORY"
    );
    expect(hasMitigationCited).toBe(true);

    // Verify project bank isolation: a different project ID must NOT recall this memory
    const differentProjectDeployment: DeploymentContext = {
      ...warmDeployment,
      deploymentId: "dep-order-001",
      projectId: "order-service",
      service: "order-service",
    };

    const differentProjectAssessment = await engine.assessDeployment(differentProjectDeployment);
    const leakedMemory = differentProjectAssessment.recalledMemories.find(
      (c) => c.memoryId === "mem-auth-gateway-table-lock"
    );
    expect(leakedMemory).toBeUndefined();
  });
});
