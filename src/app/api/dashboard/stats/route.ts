import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { HindsightAdapter } from "@/intelligence/hindsight/adapter";
import { ProjectMemoryBankManager } from "@/intelligence/hindsight/bank-manager";
import { RISK_RULE_REGISTRY } from "@/intelligence/rules/risk-rules";

export const dynamic = "force-dynamic";

export async function GET() {
  const canonicalProjectId = process.env.RELEASETRACE_PROJECT_ID || "proj_releasetrace_core";
  const projectId = canonicalProjectId;

  let totalDeployments = 0;
  let activeAssessments = 0;
  let criticalBlockedCount = 0;
  let latestDeployments: unknown[] = [];
  let databaseStatus: "CONNECTED" | "UNAVAILABLE" = "CONNECTED";

  try {
    totalDeployments = await prisma.deployment.count({ where: { projectId } });
    activeAssessments = await prisma.assessment.count({
      where: { deployment: { projectId } },
    });
    criticalBlockedCount = await prisma.assessment.count({
      where: {
        overallCategory: "CRITICAL",
        deployment: { projectId },
      },
    });
    latestDeployments = await prisma.deployment.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { assessment: true },
    });
  } catch (error) {
    databaseStatus = "UNAVAILABLE";
    console.error("[dashboard/stats] Neon query failed:", error);
  }

  const adapter = HindsightAdapter.getInstance();
  const bankManager = new ProjectMemoryBankManager(adapter);
  const bankId = bankManager.getProjectBankId(projectId);

  let memoryDocumentCount = 0;
  let hindsightStatus: "CONNECTED" | "MOCK_MODE" | "UNAVAILABLE" =
    adapter.isMock() ? "MOCK_MODE" : "CONNECTED";

  if (!adapter.isMock()) {
    try {
      const result = await adapter.getRawClient().listDocuments(bankId);
      const docs = result as unknown as { total?: number; items?: unknown[] };
      memoryDocumentCount = docs.total ?? docs.items?.length ?? 0;
    } catch (error) {
      hindsightStatus = "UNAVAILABLE";
      console.error("[dashboard/stats] Hindsight query failed:", error);
    }
  } else {
    memoryDocumentCount = adapter.getBankMemoriesCount(bankId);
  }

  return NextResponse.json({
    projectId,
    bankId,
    totalDeployments,
    activeAssessments,
    criticalBlockedCount,
    memoryDocumentCount,
    deterministicRuleCount: RISK_RULE_REGISTRY.length,
    latestDeployments,
    databaseStatus,
    hindsightStatus,
  });
}
