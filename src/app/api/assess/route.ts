import { NextResponse } from "next/server";
import { z } from "zod";
import { ReleaseTraceIntelligenceEngine } from "@/intelligence/engine/intelligence-engine";
import {
  EnvironmentConfigSchema,
} from "@/intelligence/memory/schema";
import type { DeploymentContext } from "@/intelligence/types";

const AssessInputSchema = z.object({
  mode: z.enum(["LIVE", "FIXTURE"]).optional(),
  projectId: z.string().min(1, "projectId is required"),
  service: z.string().min(1, "service is required"),
  commitHash: z.string().min(1, "commitHash is required"),
  branch: z.string().min(1, "branch is required"),
  targetEnvironment: z.enum(["production", "staging", "canary"]).default("production"),
  environmentNotes: z.string().optional(),
  codeDiff: z.string().optional(),
  gitDiffSummary: z
    .object({
      filesChanged: z.array(z.string()).default([]),
      additions: z.number().int().nonnegative().default(0),
      deletions: z.number().int().nonnegative().default(0),
      hasDatabaseMigrations: z.boolean().default(false),
      migrationDetails: z.string().optional(),
    })
    .optional(),
  environment: EnvironmentConfigSchema,
  telemetrySnapshot: z
    .object({
      errorRate: z.number().min(0).max(1),
      p95LatencyMs: z.number().nonnegative(),
      cpuUtilization: z.number().min(0).max(1),
      memoryUtilization: z.number().min(0).max(1),
      connectionPoolSaturation: z.number().min(0).max(1),
    })
    .optional(),
  deploymentId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();

    // Check for explicit FIXTURE mode
    if (rawBody.mode === "FIXTURE") {
      return NextResponse.json({
        id: `fix-${Date.now()}`,
        deploymentId: rawBody.deploymentId || `dep-fixture-${Date.now()}`,
        projectId: rawBody.projectId || "demo-fixture",
        overallRisk: "NOMINAL",
        assessmentState: "FIXTURE_EVALUATION",
        overallCategory: "LOW_KNOWN_RISK",
        reasons: ["Evaluated using explicit demo fixture baseline."],
        recalledMemories: [],
        currentEvidenceSummary: {
          criticalSignals: ["Explicit fixture test scenario: Nominal baseline."],
        },
        recommendations: [{ action: "Standard QA verification." }],
        evaluationLatencyMs: 2,
        source: "FIXTURE",
        isMock: true,
      });
    }

    // Accept either top-level fields or nested deployment object
    const payload = rawBody.deployment ? { ...rawBody.deployment, ...rawBody, deployment: undefined } : rawBody;

    // Strict schema validation
    const parsed = AssessInputSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Insufficient required deployment evidence. Refusing to fabricate missing deployment metadata.",
          validationErrors: parsed.error.issues.map(
            (issue) => `${issue.path.join(".") || "root"}: ${issue.message}`
          ),
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Build deterministic GitDiffSummary from input
    const gitDiffSummary = data.gitDiffSummary || {
      filesChanged: data.codeDiff ? ["migration.sql"] : [],
      additions: data.codeDiff
        ? data.codeDiff.split("\n").filter((l) => l.startsWith("+")).length
        : 0,
      deletions: data.codeDiff
        ? data.codeDiff.split("\n").filter((l) => l.startsWith("-")).length
        : 0,
      hasDatabaseMigrations: data.codeDiff
        ? /alter\s+table|create\s+table|drop\s+column|add\s+column/i.test(data.codeDiff)
        : false,
      migrationDetails: data.codeDiff,
    };

    const deploymentContext: DeploymentContext = {
      deploymentId: data.deploymentId || `dep-${Date.now()}`,
      projectId: data.projectId,
      service: data.service,
      timestamp: new Date().toISOString(),
      commitHash: data.commitHash,
      branch: data.branch,
      gitDiffSummary,
      environment: data.environment,
      targetEnvironment: data.targetEnvironment,
      telemetrySnapshot: data.telemetrySnapshot,
      environmentNotes: data.environmentNotes,
    };

    const engine = new ReleaseTraceIntelligenceEngine();
    const startTime = Date.now();
    const assessment = await engine.assessDeployment(deploymentContext);
    const evaluationLatencyMs = Date.now() - startTime;

    return NextResponse.json({
      ...assessment,
      evaluationLatencyMs,
      source: engine.getHindsightAdapter().isMock()
        ? "HINDSIGHT_MOCK_ENGINE"
        : "SERVER_SIDE_HINDSIGHT_ENGINE",
      isMock: engine.getHindsightAdapter().isMock(),
    });
  } catch (err: unknown) {
    console.error("Assessment API error:", err);
    return NextResponse.json(
      {
        error: "Failed to evaluate release risk",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
