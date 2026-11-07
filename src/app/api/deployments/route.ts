import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function boundedInteger(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId") || process.env.RELEASETRACE_PROJECT_ID || "proj_releasetrace_core";
  const page = boundedInteger(searchParams.get("page"), 1, 1, 1_000_000);
  const pageSize = boundedInteger(searchParams.get("pageSize"), 20, 1, 100);
  const status = searchParams.get("status");
  const environment = searchParams.get("environment");
  const query = searchParams.get("q")?.trim().slice(0, 120);

  const where = {
    projectId,
    ...(status && status !== "ALL" ? { status } : {}),
    ...(environment && environment !== "ALL" ? { environment } : {}),
    ...(query
      ? {
          OR: [
            { commitSha: { contains: query, mode: "insensitive" as const } },
            { branch: { contains: query, mode: "insensitive" as const } },
            { provider: { contains: query, mode: "insensitive" as const } },
            { providerDeploymentId: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  try {
    const [total, deployments] = await prisma.$transaction([
      prisma.deployment.count({ where }),
      prisma.deployment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          provider: true,
          providerDeploymentId: true,
          commitSha: true,
          branch: true,
          environment: true,
          status: true,
          url: true,
          startedAt: true,
          completedAt: true,
          createdAt: true,
          assessment: {
            select: {
              overallCategory: true,
              summary: true,
              recommendedAction: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      projectId,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      deployments,
    });
  } catch (error) {
    console.error("[deployments] Neon query failed:", error);
    return NextResponse.json(
      {
        error: "Deployment history is temporarily unavailable.",
        details: error instanceof Error ? error.message : "Database query failed",
      },
      { status: 503 }
    );
  }
}
