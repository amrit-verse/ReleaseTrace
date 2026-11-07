import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../../src/app/api/webhooks/deployments/route";
import { generateHmacSignature } from "../../src/lib/security/signature";
import { NextRequest } from "next/server";

vi.mock("@/lib/db/client", () => ({
  default: {
    webhookEvent: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "wh_01" }),
      update: vi.fn().mockResolvedValue({ id: "wh_01" }),
    },
    project: {
      upsert: vi.fn().mockResolvedValue({ id: "proj_01" }),
    },
  },
}));

vi.mock("@/lib/inngest/client", () => ({
  inngest: {
    send: vi.fn().mockResolvedValue({ ids: ["evt_inngest_01"] }),
  },
}));

describe("Signed Deployment Webhook Ingestion API", () => {
  const secret = "development-webhook-secret-key-32-chars-min";

  beforeEach(() => {
    process.env.RELEASETRACE_WEBHOOK_SECRET = secret;
  });

  const validPayload = {
    eventId: "gha_run_4815162342",
    provider: "github_actions",
    projectId: "proj_billing_svc",
    projectName: "Billing Microservice",
    eventType: "deployment_completed",
    timestamp: new Date().toISOString(),
    evidence: {
      commitSha: "f00ba4123456789",
      branch: "main",
      commitMessage: "fix(db): ensure table migration runs before server start",
      author: "ci-bot",
      repository: "releasetrace/billing",
      framework: "nextjs",
      runtimeVersion: "nodejs-22",
      buildPassed: true,
      testsPassed: true,
      environment: "production",
      collectedAt: new Date().toISOString(),
    },
    metadata: {
      githubWorkflow: "production-deploy",
    },
  };

  it("accepts a valid signed deployment payload with 202 Accepted", async () => {
    const rawBody = JSON.stringify(validPayload);
    const signature = generateHmacSignature(rawBody, secret);
    const timestamp = new Date().toISOString();

    const request = new NextRequest("http://localhost:3000/api/webhooks/deployments", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-releasetrace-signature": signature,
        "x-releasetrace-timestamp": timestamp,
      },
      body: rawBody,
    });

    const response = await POST(request);
    expect(response.status).toBe(202);

    const json = await response.json();
    expect(json.accepted).toBe(true);
    expect(json.eventId).toBe("gha_run_4815162342");
    expect(json.status).toBe("queued_for_assessment");
  });

  it("rejects an invalid signature with 401 Unauthorized", async () => {
    const rawBody = JSON.stringify(validPayload);
    const invalidSignature = "sha256=0000000000000000000000000000000000000000000000000000000000000000";

    const request = new NextRequest("http://localhost:3000/api/webhooks/deployments", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-releasetrace-signature": invalidSignature,
        "x-releasetrace-timestamp": new Date().toISOString(),
      },
      body: rawBody,
    });

    const response = await POST(request);
    expect(response.status).toBe(401);

    const json = await response.json();
    expect(json.error).toContain("Unauthorized");
  });

  it("rejects payload missing required contract fields with 422 Unprocessable Entity", async () => {
    const invalidPayload = {
      eventId: "bad_payload",
      provider: "github_actions",
      // Missing projectId, evidence, etc.
    };

    const rawBody = JSON.stringify(invalidPayload);
    const signature = generateHmacSignature(rawBody, secret);

    const request = new NextRequest("http://localhost:3000/api/webhooks/deployments", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-releasetrace-signature": signature,
        "x-releasetrace-timestamp": new Date().toISOString(),
      },
      body: rawBody,
    });

    const response = await POST(request);
    expect(response.status).toBe(422);

    const json = await response.json();
    expect(json.error).toContain("failed contract validation");
  });
});
