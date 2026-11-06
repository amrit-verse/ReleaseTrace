import { NextResponse } from "next/server";
import { ReleaseTraceIntelligenceEngine } from "@/intelligence/engine/intelligence-engine";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { deployment, projectId, service, environmentNotes, codeDiff } = body;

    const engine = new ReleaseTraceIntelligenceEngine();

    const deploymentContext = deployment || {
      deploymentId: `dep-${Date.now()}`,
      projectId: projectId || "proj-default",
      service: service || "release-service",
      timestamp: new Date().toISOString(),
      commitHash: "HEAD",
      branch: "main",
      gitDiffSummary: {
        filesChanged: ["schema.prisma", "migration.sql"],
        additions: 12,
        deletions: 2,
        hasDatabaseMigrations: true,
        migrationDetails: codeDiff || "Database migration applied",
      },
      environment: {
        runtime: "nodejs@22.0.0",
        database: {
          type: "postgresql",
          version: "15.4",
          poolSize: 20,
        },
        infrastructure: {
          provider: "vercel",
          region: "iad1",
          replicas: 1,
        },
        featureFlags: {},
        envVariables: {},
        dependencies: {},
      },
      targetEnvironment: "production",
    };

    const startTime = Date.now();
    const assessment = await engine.assessDeployment(deploymentContext);
    const evaluationLatencyMs = Date.now() - startTime;

    return NextResponse.json({
      ...assessment,
      evaluationLatencyMs,
      source: engine.getHindsightAdapter().isMock() ? "HINDSIGHT_MOCK_ENGINE" : "SERVER_SIDE_HINDSIGHT_ENGINE",
      isMock: engine.getHindsightAdapter().isMock(),
    });
  } catch (err: any) {
    console.error("Assessment API error:", err);
    return NextResponse.json(
      { error: "Failed to evaluate release risk", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
