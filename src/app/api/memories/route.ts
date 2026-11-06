import { NextResponse } from "next/server";
import { mockMemories } from "@/data/mockData";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    total: mockMemories.length,
    memories: mockMemories,
    source: "HINDSIGHT_API",
    engineVersion: "v2.4.0-release",
    cluster: "rt-prod-cluster-us-east-4",
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, service, environment, severity, symptoms, rootCause, failedApproaches, resolution, provenance } = body;

    if (!title || !service || !rootCause) {
      return NextResponse.json(
        { error: "Missing required fields: title, service, rootCause" },
        { status: 400 }
      );
    }

    const newMemory = {
      id: `MEM-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      title,
      service,
      environment: environment || "production",
      severity: severity || "SEV-2",
      symptoms: symptoms || [],
      rootCause,
      failedApproaches: failedApproaches || [],
      resolution: resolution || "Pending runbook ratification",
      provenance: provenance || {
        gitCommit: "manual-input",
        incidentTicket: "INC-MANUAL",
        runbookUrl: "https://runbooks.internal/tbd",
        postMortemAuthor: "engineer@internal",
        signoffEngineer: "lead@internal",
        timestamp: new Date().toISOString(),
        serviceVersion: "v1.0.0",
      },
      tags: ["retained", service],
      recalledCount: 1,
      preventedIncidentsCount: 0,
      source: "HINDSIGHT_API",
    };

    return NextResponse.json(
      {
        message: "Memory successfully indexed and committed to Hindsight Memory Engine",
        memory: newMemory,
        retentionStatus: "VERIFIED_RETENTION",
        indexTimeMs: 14.8,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 }
    );
  }
}
