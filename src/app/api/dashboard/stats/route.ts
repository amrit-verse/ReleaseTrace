import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { HindsightAdapter } from "@/intelligence/hindsight/adapter";
import { ProjectMemoryBankManager } from "@/intelligence/hindsight/bank-manager";
import { RISK_RULE_REGISTRY } from "@/intelligence/rules/risk-rules";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const canonicalProjectId = process.env.RELEASETRACE_PROJECT_ID || "proj_releasetrace_core";
    const projectId =
      searchParams.get("projectId") ||
      searchParams.get("service") ||
      canonicalProjectId;

    // Dynamic count from actual risk rule registry
    const deterministicRuleCount = RISK_RULE_REGISTRY.length;

    // Database statistics with graceful empty fallback
    let totalDeployments = 0;
    let activeAssessments = 0;
    let criticalBlockedCount = 0;
    let latestDeployments: unknown[] = [];

    try {
      totalDeployments = await prisma.deployment.count({
        where: projectId ? { projectId } : undefined,
      });
      activeAssessments = await prisma.assessment.count();
      criticalBlockedCount = await prisma.deployment.count({
        where: {
          assessment: {
            overallCategory: "CRITICAL",
          },
        },
      });

      latestDeployments = await prisma.deployment.findMany({
        where: projectId ? { projectId } : undefined,
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          assessment: true,
        },
      });
    } catch {
      // Database not reachable or unmigrated; report 0 honestly
      totalDeployments = 0;
      activeAssessments = 0;
      criticalBlockedCount = 0;
      latestDeployments = [];
    }

    // Memories from canonical project bank
    const adapter = HindsightAdapter.getInstance();
    const bankManager = new ProjectMemoryBankManager(adapter);
    const bankId = bankManager.getProjectBankId(projectId);

    let verifiedPrecedentsCount = 0;
    if (adapter.isMock()) {
      verifiedPrecedentsCount = adapter.getBankMemoriesCount(bankId);
    } else {
      try {
        const docs = await adapter.getRawClient().listDocuments(bankId);
        verifiedPrecedentsCount = (docs as any)?.total ?? (docs as any)?.items?.length ?? 0;
      } catch {
        verifiedPrecedentsCount = 0;
      }
    }

    return NextResponse.json({
      projectId,
      bankId,
      totalDeployments,
      activeAssessments,
      criticalBlockedCount,
      verifiedPrecedentsCount,
      deterministicRuleCount,
      latestDeployments,
      rules: RISK_RULE_REGISTRY,
      isMock: adapter.isMock(),
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error: "Failed to fetch dashboard stats",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
