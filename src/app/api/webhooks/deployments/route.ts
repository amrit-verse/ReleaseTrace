import { NextRequest, NextResponse } from "next/server";
import { DeploymentEventSchema } from "@/contracts";
import { verifyHmacSha256, verifyTimestampFreshness } from "@/lib/security/signature";
import { correlateVercelDeployment } from "@/lib/vercel";
import { inngest } from "@/lib/inngest/client";
import prisma from "@/lib/db/client";

export async function POST(request: NextRequest) {
  const secret =
    process.env.RELEASETRACE_WEBHOOK_SECRET ||
    process.env.WEBHOOK_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: "Configuration Error: RELEASETRACE_WEBHOOK_SECRET is not configured on server" },
      { status: 500 }
    );
  }

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
    const sigCheck = verifyHmacSha256(rawBody, signatureHeader, secret, timestampHeader);
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

  // 5. Durable Idempotency Tracking
  const idempotencyKey = `${deploymentEvent.provider}-${deploymentEvent.eventId}`;
  try {
    // Ensure parent project exists
    await prisma.project.upsert({
      where: { id: deploymentEvent.projectId },
      create: {
        id: deploymentEvent.projectId,
        name: deploymentEvent.projectName || "ReleaseTrace Project",
        slug: deploymentEvent.projectId.toLowerCase().replace(/[^a-z0-9_-]/g, "-"),
        repository: deploymentEvent.evidence.repository || "amrit-verse/ReleaseTrace",
        hindsightBankId: `rt-${deploymentEvent.projectId}`,
        workspace: {
          connectOrCreate: {
            where: { slug: "default-workspace" },
            create: {
              id: "ws-default",
              name: "Default Workspace",
              slug: "default-workspace",
            },
          },
        },
      },
      update: {
        name: deploymentEvent.projectName || undefined,
      },
    });

    const existingWebhookRecord = await prisma.webhookEvent.findUnique({
      where: { idempotencyKey },
    });

    // If previously received AND successfully processed/dispatched, return deduplicated 200
    if (existingWebhookRecord && existingWebhookRecord.processed === true) {
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

    // If new event, record as pending (processed: false)
    if (!existingWebhookRecord) {
      await prisma.webhookEvent.create({
        data: {
          projectId: deploymentEvent.projectId,
          provider: deploymentEvent.provider,
          eventId: deploymentEvent.eventId,
          idempotencyKey,
          eventType: deploymentEvent.eventType,
          payload: deploymentEvent as unknown as object,
          processed: false, // Starts as pending until Inngest dispatch succeeds
          error: null,
        },
      });
    }
  } catch (dbErr) {
    console.warn("DB webhook idempotency tracking unavailable:", dbErr);
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
    const sendResult = await inngest.send({
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

    // Mark event as successfully processed in DB ONLY AFTER Inngest dispatch succeeds
    try {
      await prisma.webhookEvent.update({
        where: { idempotencyKey },
        data: {
          processed: true,
          processedAt: new Date(),
          error: null,
        },
      });
    } catch {
      // Non-blocking DB status update
    }

    // 8. Return 202 Accepted with dispatched Inngest event ID
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
        inngestEventIds: sendResult?.ids || [],
        receivedAt: new Date().toISOString(),
      },
      { status: 202 }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Inngest event dispatch failed:", err);

    // Record failure in DB so retry is permitted
    try {
      await prisma.webhookEvent.update({
        where: { idempotencyKey },
        data: {
          processed: false,
          error: errorMessage,
        },
      });
    } catch {
      // Ignore DB tracking failure
    }

    return NextResponse.json(
      {
        accepted: false,
        recoverable: true,
        error: "Background Execution Error: Failed to dispatch deployment event to Inngest",
        details: errorMessage,
        eventId: deploymentEvent.eventId,
      },
      { status: 502 }
    );
  }
}
