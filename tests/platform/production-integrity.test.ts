import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as memoryPOST } from "@/app/api/memories/route";
import { POST as webhookPOST } from "@/app/api/webhooks/deployments/route";
import { ProjectMemoryBankManager } from "@/intelligence/hindsight/bank-manager";
import { generateHmacSignature } from "@/lib/security/signature";
import { inngest } from "@/lib/inngest/client";
import { NextRequest } from "next/server";

vi.mock("@/lib/db/client", () => {
  const webhookStore = new Map<string, any>();
  return {
    default: {
      webhookEvent: {
        findUnique: vi.fn().mockImplementation(({ where }) => {
          return Promise.resolve(webhookStore.get(where.idempotencyKey) || null);
        }),
        create: vi.fn().mockImplementation(({ data }) => {
          webhookStore.set(data.idempotencyKey, { ...data, id: "wh_" + Math.random().toString(36).substring(7) });
          return Promise.resolve(webhookStore.get(data.idempotencyKey));
        }),
        update: vi.fn().mockImplementation(({ where, data }) => {
          const item = webhookStore.get(where.idempotencyKey);
          if (item) {
            Object.assign(item, data);
          }
          return Promise.resolve(item || { ...data });
        }),
      },
      project: {
        upsert: vi.fn().mockResolvedValue({ id: "proj_releasetrace_core", name: "ReleaseTrace Core" }),
      },
      assessment: {
        upsert: vi.fn().mockResolvedValue({ id: "ass_01" }),
      },
      memoryReference: {
        create: vi.fn().mockResolvedValue({ id: "mr_01" }),
      },
      resolution: {
        upsert: vi.fn().mockResolvedValue({ id: "res_01" }),
      },
    },
  };
});

vi.mock("@/lib/inngest/client", () => ({
  inngest: {
    send: vi.fn().mockResolvedValue({ ids: ["inngest_evt_test"] }),
  },
}));

describe("Production Integrity & Security Invariant Suite", () => {
  const secret = "test-webhook-secret-key-32-chars-min";

  beforeEach(() => {
    process.env.RELEASETRACE_WEBHOOK_SECRET = secret;
    process.env.RELEASETRACE_PROJECT_ID = "proj_releasetrace_core";
    vi.clearAllMocks();
  });

  describe("1. Canonical Project Identity Across System", () => {
    it("generates consistent canonical project bank ID without hardcoded fallbacks", () => {
      const bankManager = new ProjectMemoryBankManager();
      const bankId = bankManager.getProjectBankId();
      expect(bankId).toBe("rt-proj_releasetrace_core");

      const explicitBankId = bankManager.getProjectBankId("proj_releasetrace_core");
      expect(explicitBankId).toBe("rt-proj_releasetrace_core");
    });
  });

  describe("2. Real Engineer Authorization & Fake Auth Rejection", () => {
    const validMemoryPayload = {
      projectId: "proj_releasetrace_core",
      service: "ReleaseTrace Core",
      title: "Connection pool starvation during migration",
      confirmedRootCause: "PostgreSQL pool size 10 was saturated during table lock",
      verifiedMitigation: "Increase connection pool to 25 and set pool acquire timeout to 5000ms",
      confirmation: {
        isConfirmed: true,
        confirmedBy: "lead@releasetrace.dev",
        verificationEvidence: "Forensic staging incident runbook verification #4102",
        notes: "Production-ready engineering confirmation",
      },
    };

    it("rejects spoofed x-engineer-email header with 401 Unauthorized", async () => {
      const req = new NextRequest("http://localhost:3000/api/memories", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-engineer-email": "spoofed-attacker@domain.com", // Spoofed unverified header
        },
        body: JSON.stringify(validMemoryPayload),
      });

      const res = await memoryPOST(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.authenticatedIdentity).toBe(false);
      expect(json.rejected).toBe(true);
      expect(json.error).toContain("Verified engineer authorization required");
    });

    it("accepts valid bearer token and records authenticated engineer identity", async () => {
      const req = new NextRequest("http://localhost:3000/api/memories", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify(validMemoryPayload),
      });

      const res = await memoryPOST(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.authenticatedIdentity).toBe(true);
      expect(json.identityType).toBe("AUTHORIZED_ENGINEER");
      expect(json.isProductionVerified).toBe(true);
      expect(json.bankId).toBe("rt-proj_releasetrace_core");
    });

    it("isolates demo approval into demo bank and explicitly marks as unauthenticated", async () => {
      const req = new NextRequest("http://localhost:3000/api/memories", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-releasetrace-demo-mode": "true", // Demo approval mode
        },
        body: JSON.stringify(validMemoryPayload),
      });

      const res = await memoryPOST(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.authenticatedIdentity).toBe(false);
      expect(json.identityType).toBe("UNAUTHENTICATED_DEMO_APPROVAL");
      expect(json.isProductionVerified).toBe(false);
      expect(json.bankId).toBe("rt-demo-proj_releasetrace_core");
    });
  });

  describe("3. Webhook Idempotency & Inngest Dispatch Recovery", () => {
    const createEvent = (eventId: string) => ({
      eventId,
      provider: "github_actions" as const,
      projectId: "proj_releasetrace_core",
      projectName: "ReleaseTrace Core",
      eventType: "deployment_started" as const,
      timestamp: new Date().toISOString(),
      evidence: {
        commitSha: "c0ffee123456789",
        branch: "main",
        commitMessage: "test: verify outbox retry pattern",
        author: "amrit-verse",
        repository: "amrit-verse/ReleaseTrace",
        framework: "nextjs",
        runtimeVersion: "nodejs-22",
        buildPassed: true,
        testsPassed: true,
        environment: "production" as const,
        collectedAt: new Date().toISOString(),
      },
    });

    it("allows retry after initial Inngest dispatch failure and does not mark as processed", async () => {
      const eventId = "evt_dispatch_fail_and_retry";
      const payload = createEvent(eventId);
      const rawBody = JSON.stringify(payload);
      const timestamp = new Date().toISOString();
      const signature = generateHmacSignature(rawBody, secret);

      // 1. Simulate Inngest failure
      vi.mocked(inngest.send).mockRejectedValueOnce(new Error("Inngest API unavailable (503)"));

      const failReq = new NextRequest("http://localhost:3000/api/webhooks/deployments", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-releasetrace-signature": signature,
          "x-releasetrace-timestamp": timestamp,
        },
        body: rawBody,
      });

      const failRes = await webhookPOST(failReq);
      expect(failRes.status).toBe(502);
      const failJson = await failRes.json();
      expect(failJson.accepted).toBe(false);
      expect(failJson.recoverable).toBe(true);

      // 2. Retry the EXACT same webhook - it MUST NOT be dropped as 'already_processed'
      vi.mocked(inngest.send).mockResolvedValueOnce({ ids: ["inngest_evt_recovered"] });

      const retryReq = new NextRequest("http://localhost:3000/api/webhooks/deployments", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-releasetrace-signature": signature,
          "x-releasetrace-timestamp": timestamp,
        },
        body: rawBody,
      });

      const retryRes = await webhookPOST(retryReq);
      expect(retryRes.status).toBe(202);
      const retryJson = await retryRes.json();
      expect(retryJson.accepted).toBe(true);
      expect(retryJson.status).toBe("queued_for_assessment");
      expect(retryJson.inngestEventIds).toEqual(["inngest_evt_recovered"]);

      // 3. Third arrival AFTER successful dispatch - MUST be recognized as duplicate
      const dupReq = new NextRequest("http://localhost:3000/api/webhooks/deployments", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-releasetrace-signature": signature,
          "x-releasetrace-timestamp": timestamp,
        },
        body: rawBody,
      });

      const dupRes = await webhookPOST(dupReq);
      expect(dupRes.status).toBe(200);
      const dupJson = await dupRes.json();
      expect(dupJson.deduplicated).toBe(true);
      expect(dupJson.status).toBe("already_processed");
    });
  });
});
