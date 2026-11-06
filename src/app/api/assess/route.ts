import { NextResponse } from "next/server";
import { evaluateReleaseRisk } from "@/lib/memoryEngine";
import { mockMemories } from "@/data/mockData";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { codeDiff, serviceName, environmentNotes, activeMemories } = body;

    const memoriesList = activeMemories && Array.isArray(activeMemories) ? activeMemories : mockMemories;

    const result = evaluateReleaseRisk(
      codeDiff || "",
      serviceName || "service",
      environmentNotes || "",
      memoriesList
    );

    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString(),
      evaluationLatencyMs: 8.4,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to evaluate release risk" },
      { status: 500 }
    );
  }
}
