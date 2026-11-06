import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { HindsightAdapter } from "@/intelligence/hindsight/adapter";

export async function GET() {
  try {
    const totalDeployments = await prisma.deployment.count();
    const activeAssessments = await prisma.assessment.count();
    const criticalBlockedCount = await prisma.deployment.count({
      where: {
        assessment: {
          overallCategory: "CRITICAL",
        },
      },
    });

    // Count of risk rules
    const deterministicRuleCount = 8; // Number of static rule checks implemented in risk-rules.ts

    // Memories from Hindsight
    const adapter = HindsightAdapter.getInstance();
    let verifiedPrecedentsCount = 0;
    try {
      const bankId = process.env.HINDSIGHT_BANK_PREFIX || "releasetrace";
      const recallResult = await adapter.recall(bankId, "deployment failure");
      verifiedPrecedentsCount = recallResult.results.length;
    } catch {
      verifiedPrecedentsCount = 0;
    }

    const latestDeployments = await prisma.deployment.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        assessment: true,
      },
    });

    return NextResponse.json({
      totalDeployments,
      activeAssessments,
      criticalBlockedCount,
      verifiedPrecedentsCount,
      deterministicRuleCount,
      latestDeployments,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
