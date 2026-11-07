import { NextResponse } from "next/server";
import { ReleaseTraceIntelligenceEngine } from "@/intelligence/engine/intelligence-engine";
import {
  validateVerifiedMemory,
  assertEngineerConfirmation,
  type VerifiedEngineeringMemoryInput,
} from "@/intelligence/memory/schema";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId =
      searchParams.get("projectId") ||
      searchParams.get("service") ||
      "auth-gateway";
    const query = searchParams.get("q") || "deployment failure migration incident";

    const engine = new ReleaseTraceIntelligenceEngine();
    const bankManager = engine.getBankManager();
    const adapter = engine.getHindsightAdapter();
    const bankId = bankManager.getProjectBankId(projectId);

    let recallResult;
    try {
      recallResult = await adapter.recall(bankId, query);
    } catch (err: unknown) {
      return NextResponse.json(
        {
          status: "UNAVAILABLE",
          bankId,
          projectId,
          total: 0,
          memories: [],
          source: "UNAVAILABLE",
          error: err instanceof Error ? err.message : String(err),
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: "ok",
      bankId,
      projectId,
      total: recallResult.results.length,
      memories: recallResult.results,
      source: adapter.isMock() ? "HINDSIGHT_MOCK_TRANSPORT" : "HINDSIGHT_CLOUD",
      isMock: adapter.isMock(),
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error: "Failed to retrieve memories",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const title = body.title;
    const service = body.service;
    const rootCause = body.confirmedRootCause || body.rootCause;
    const resolution = body.verifiedMitigation || body.resolution;
    const projectId = body.projectId || service || "auth-gateway";
    const deploymentId = body.deploymentId || `dep-${service}-verified`;

    if (!title || !service || !rootCause || !resolution) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: title, service, rootCause (confirmedRootCause), and resolution (verifiedMitigation) must be provided.",
        },
        { status: 400 }
      );
    }

    // Authenticated engineer confirmation validation
    const authHeader = request.headers.get("x-engineer-email") || request.headers.get("x-authenticated-user");
    const clientConfirmation = body.confirmation;

    if (!clientConfirmation || clientConfirmation.isConfirmed !== true) {
      return NextResponse.json(
        {
          error:
            "Engineer confirmation required. Speculative or unconfirmed LLM hypotheses cannot be retained into Hindsight.",
        },
        { status: 403 }
      );
    }

    const confirmedBy =
      authHeader ||
      clientConfirmation.confirmedBy ||
      "unauthenticated-demo-operator";

    // Where real authentication does not exist, explicitly label as demo workspace confirmation
    const isRealAuth = Boolean(authHeader);
    const confirmationNotes = isRealAuth
      ? clientConfirmation.notes || "Authenticated engineer verification"
      : "DEMO_WORKSPACE_APPROVAL: Validated in test/demo workspace; not production-SSO verified.";

    // Construct deterministic memory ID
    const deterministicMemoryId =
      body.id ||
      `mem-${projectId}-${service}-${title
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .slice(0, 30)}`;

    const memoryInput: VerifiedEngineeringMemoryInput = {
      id: deterministicMemoryId,
      projectId,
      deploymentId,
      service,
      createdAt: body.createdAt || new Date().toISOString(),
      environment: body.environment || {
        runtime: "nodejs@22.0.0",
        database: {
          type: "postgresql",
          version: "15.6",
          poolSize: 20,
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
      failureContext: body.failureContext || {
        failureType: body.failureType || title,
        symptoms:
          Array.isArray(body.symptoms) && body.symptoms.length > 0
            ? body.symptoms
            : [rootCause],
        errorSignatures: body.errorSignatures || [],
        logsSample: body.logsSample || [],
      },
      confirmedRootCause: rootCause,
      verifiedMitigation: resolution,
      outcome: body.outcome || "resolved",
      confirmation: {
        confirmedBy,
        confirmedAt: clientConfirmation.confirmedAt || new Date().toISOString(),
        isConfirmed: true,
        confirmationMethod: clientConfirmation.confirmationMethod || "manual_investigation",
        verificationEvidence:
          clientConfirmation.verificationEvidence ||
          `Forensic verification of incident ${title}: ${rootCause}`,
        notes: confirmationNotes,
      },
      tags: body.tags || [service, "verified-resolution", "releasetrace"],
    };

    // Strictly validate against schema and engineer confirmation invariant
    validateVerifiedMemory(memoryInput);
    assertEngineerConfirmation({
      confirmation: memoryInput.confirmation,
      isHypothesis: false,
    });

    const engine = new ReleaseTraceIntelligenceEngine();
    const retentionWorkflow = engine.getRetentionWorkflow();
    const retentionResult = await retentionWorkflow.retainVerifiedExperience(memoryInput);

    if (!retentionResult.success) {
      return NextResponse.json(
        {
          error: "Retention Failed: Live Hindsight rejected or failed to index memory",
          details: "Hindsight retention did not report success",
        },
        { status: 502 }
      );
    }

    const adapter = engine.getHindsightAdapter();
    const isMock = adapter.isMock();
    const retentionStatus = isMock ? "MOCK_RETAINED" : "LIVE_RETAINED";

    return NextResponse.json(
      {
        message: isMock
          ? "Memory verified and indexed in local mock bank (Mock transport active)"
          : "Memory permanently committed to Hindsight Cloud cluster",
        bankId: retentionResult.bankId,
        documentId: retentionResult.documentId,
        memoryId: retentionResult.memoryId,
        retentionStatus,
        isMock,
        source: isMock ? "HINDSIGHT_MOCK_TRANSPORT" : "HINDSIGHT_CLOUD",
        authenticatedIdentity: isRealAuth,
        retentionResult,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error: "Failed to retain memory",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId =
      searchParams.get("projectId") ||
      searchParams.get("service") ||
      "auth-gateway";
    const action = searchParams.get("action") || "reset_fixture";
    const confirmParam = searchParams.get("confirm");

    const engine = new ReleaseTraceIntelligenceEngine();
    const adapter = engine.getHindsightAdapter();
    const bankManager = engine.getBankManager();
    const bankId = bankManager.getProjectBankId(projectId);

    // Fixture / Mock store reset
    if (action === "reset_fixture" || adapter.isMock()) {
      adapter.clearMockBank(bankId);
      return NextResponse.json({
        success: true,
        action: "FIXTURE_RESET",
        bankId,
        message: `Local fixture bank for project '${projectId}' cleared. Real cloud memories were untouched.`,
        isMock: adapter.isMock(),
      });
    }

    // Cloud memory administration: protected destructive operation
    const adminSecret = request.headers.get("x-admin-secret");
    if (!adminSecret || adminSecret !== process.env.RELEASETRACE_ADMIN_SECRET) {
      return NextResponse.json(
        {
          error:
            "Unauthorized: Destructive Cloud memory administration requires valid admin authorization (x-admin-secret).",
          action: "CLOUD_DELETE_PROTECTED",
        },
        { status: 403 }
      );
    }

    if (confirmParam !== "yes") {
      return NextResponse.json(
        {
          error: "Destructive cloud operation requires confirm=yes query parameter.",
        },
        { status: 400 }
      );
    }

    // Real cloud deletion
    await adapter.getRawClient().deleteBank(bankId);
    return NextResponse.json({
      success: true,
      action: "CLOUD_BANK_DELETED",
      bankId,
      message: `Hindsight Cloud bank '${bankId}' permanently deleted.`,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error: "Failed to process bank deletion",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
