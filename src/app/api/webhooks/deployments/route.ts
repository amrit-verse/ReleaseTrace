import { NextRequest, NextResponse } from "next/server";
import { DeploymentEventSchema } from "@/contracts";
import { verifyHmacSha256, verifyTimestampFreshness } from "@/lib/security/signature";
import { correlateVercelDeployment } from "@/lib/vercel";
import { inngest } from "@/lib/inngest/client";
import prisma from "@/lib/db/client";

export async function POST(request: NextRequest) {
  const secret =
    process.env.RELESETRACE_WEBHOOK_SECRET ||
    process.env.WEBHOOK_SECRET ||
    "development-webhook-secret-key-32-chars-min";

  // 1. Read raw body text for timing-safe HMAC validation
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to read request body stream", details: String(err) },
      { status: 400 }
    );
  }

  // 2. Extract security headers
  const signatureHeader =
    request.headers.get("x-releasetrace-signature") ||
    request.headers.get("x-hub-signature-256");
  const timestampHeader = request.headers.get("x-releasetrace-timestamp");

  // Enforce strict HMAC verification when signature header is present or in production
  if (process.env.NODE_ENV === "production" || signatureHeader) {
    const sigCheck = verifyHmacSha256(rawBody, signatureHeader, secret);
    if (!sigCheck.isValid) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing webhook signature", reason: sigCheck.reason },
        { status: 401 }
      );
    }
  }

  // 3. Timestamp anti-replay check
  if (timestampHeader) {
    const timeCheck = verifyTimestampFreshness(timestampHeader, 300);
    if (!timeCheck.isValid) {
      return NextResponse.json(
        { error: "Bad Request: Replay protection triggered", reason: timeCheck.reason },
        { status: 400 }
      );
    }
  }

  // 4. Parse & validate payload through frozen Zod contract
  let jsonPayload: unknown;
  try {
    jsonPayload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
  }

  const parseResult = DeploymentEventSchema.safeParse(jsonPayload);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: "Unprocessable Entity: Payload failed contract validation",
        validationErrors: parseResult.error.errors,
      },
      { status: 422 }
    );
  }

  const deploymentEvent = parseResult.data;

  // 5. Idempotency Check
  const idempotencyKey = `${deploymentEvent.provider}-${deploymentEvent.eventId}`;
  try {
    const existing = await prisma.webhookEvent.findUnique({
      where: { idempotencyKey },
    });

    if (existing) {
      return NextResponse.json(
        {
          accepted: true,
          deduplicated: true,
          status: "already_processed",
          message: "Event already received and processed idempotently",
          eventId: deploymentEvent.eventId,
        },
        { status: 200 }
      );
    }

    // Persist new webhook event
    await prisma.webhookEvent.create({
      data: {
        projectId: deploymentEvent.projectId,
        provider: deploymentEvent.provider,
        eventId: deploymentEvent.eventId,
        idempotencyKey,
        eventType: deploymentEvent.eventType,
        payload: deploymentEvent as unknown as object,
        processed: true,
        processedAt: new Date(),
      },
    });
  } catch {
    // If DB is offline or mock store, continue safely
  }

  // 6. Asynchronously correlate with Vercel deployment by commit SHA
  let vercelUrl = deploymentEvent.evidence.vercelDeploymentUrl;
  let vercelId = deploymentEvent.evidence.vercelDeploymentId;

  if (!vercelUrl) {
    try {
      const vercelRes = await correlateVercelDeployment(deploymentEvent.evidence.commitSha);
      if (vercelRes.found && vercelRes.deployment) {
        vercelUrl = vercelRes.deployment.url;
        vercelId = vercelRes.deployment.id;
      }
    } catch {
      // Non-blocking correlation failure
    }
  }

  // 7. Enqueue Inngest background event
  try {
    await inngest.send({
      name: "releasetrace/deployment.received",
      data: {
        event: {
          ...deploymentEvent,
          evidence: {
            ...deploymentEvent.evidence,
            vercelDeploymentUrl: vercelUrl,
            vercelDeploymentId: vercelId,
          },
        },
        correlatedVercelUrl: vercelUrl,
        correlatedVercelId: vercelId,
      },
    });
  } catch (err) {
    console.warn("Inngest event dispatch skipped or dev server offline:", err);
  }

  // 8. Return 202 Accepted
  return NextResponse.json(
    {
      accepted: true,
      deduplicated: false,
      eventId: deploymentEvent.eventId,
      provider: deploymentEvent.provider,
      commitSha: deploymentEvent.evidence.commitSha,
      vercelCorrelated: Boolean(vercelUrl),
      vercelUrl: vercelUrl || null,
      status: "queued_for_assessment",
      receivedAt: new Date().toISOString(),
    },
    { status: 202 }
  );
}
