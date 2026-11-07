import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const projectId = process.env.RELEASETRACE_PROJECT_ID || "proj_releasetrace_core";

  try {
    const deployment = await prisma.deployment.findFirst({
      where: { id, projectId },
      include: {
        project: { select: { name: true, repository: true } },
        assessment: { include: { memoryReferences: true, resolutions: true } },
        resolution: true,
      },
    });

    if (!deployment) {
      return NextResponse.json(
        { error: "Deployment not found for the configured project." },
        { status: 404 }
      );
    }

    return NextResponse.json({ deployment });
  } catch (error) {
    console.error("[deployment detail] Neon query failed:", error);
    return NextResponse.json(
      { error: "Deployment details are temporarily unavailable." },
      { status: 503 }
    );
  }
}
