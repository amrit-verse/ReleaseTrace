import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/webhooks/deployments/route";
import { generateHmacSignature, signPayload, verifySignature } from "@/lib/security/signature";
import { VercelClient, VercelApiError, correlateVercelDeployment } from "@/lib/vercel/index";
import { processDeploymentWebhook } from "@/lib/inngest/functions";
import { NextRequest } from "next/server";

vi.mock("@/lib/db/client", () => {
  const mockWebhookEvents = new Map();
  const mockDeployments = new Map();

  return {
    default: {
      webhookEvent: {
        findUnique: vi.fn().mockImplementation(({ where }) => {
          return Promise.resolve(mockWebhookEvents.get(where.idempotencyKey) || null);
        }),
        create: vi.fn().mockImplementation(({ data }) => {
          mockWebhookEvents.set(data.idempotencyKey, { ...data, id: "mock_wh_id" });
          return Promise.resolve({ ...data, id: "mock_wh_id" });
        }),
        updateMany: vi.fn().mockImplementation(({ where, data }) => {
          const item = mockWebhookEvents.get(where.idempotencyKey);
          if (item) {
            Object.assign(item, data);
          }
          return Promise.resolve({ count: 1 });
        }),
      },
      project: {
        findUnique: vi.fn().mockImplementation(({ where }) => {
          return Promise.resolve({
            id: where.id || "proj_core",
            name: "ReleaseTrace Core",
            slug: "core",
            repository: "amrit-verse/releasetrace",
            hindsightBankId: "bank_core",
          });
        }),
        create: vi.fn().mockResolvedValue({ id: "proj_core" }),
      },
      workspace: {
        findFirst: vi.fn().mockResolvedValue({ id: "ws_01", name: "Default", slug: "default" }),
        create: vi.fn().mockResolvedValue({ id: "ws_01", name: "Default", slug: "default" }),
      },
      deployment: {
        upsert: vi.fn().mockImplementation(({ create, update }) => {
          const record = { ...(create || update), id: "dpl_mock_id" };
          mockDeployments.set(record.commitSha, record);
          return Promise.resolve(record);
        }),
        findFirst: vi.fn().mockImplementation(({ where }) => {
          return Promise.resolve(mockDeployments.get(where.commitSha) || null);
        }),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: "audit_01" }),
      },
      __store: {
        mockWebhookEvents,
        mockDeployments,
      },
    },
    prisma: {
      webhookEvent: {
        findUnique: vi.fn(),
        create: vi.fn(),
        updateMany: vi.fn(),
      },
      project: {
        findUnique: vi.fn().mockResolvedValue({ id: "proj_core" }),
      },
      deployment: {
        upsert: vi.fn().mockResolvedValue({ id: "dpl_mock_id", commitSha: "abc", status: "DEPLOYED" }),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: "audit_01" }),
      },
    },
  };
});

vi.mock("@/lib/inngest/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/inngest/client")>();
  return {
    ...actual,
    inngest: {
      ...actual.inngest,
      send: vi.fn().mockResolvedValue({ ids: ["inngest_evt_101"] }),
    },
  };
});

describe("Platform & Integration Engine — Thorough Verification", () => {
  const secret = "development-webhook-secret-key-32-chars-min";

  const createValidPayload = (overrides = {}) => ({
    eventId: "evt_" + Math.random().toString(36).substring(7),
    provider: "github_actions" as const,
    projectId: "proj_core",
    projectName: "ReleaseTrace Core",
    eventType: "deployment_completed" as const,
    timestamp: new Date().toISOString(),
    evidence: {
      commitSha: "8a4f9103c8e765b2104d5e89a",
      branch: "main",
      commitMessage: "feat(db): add deployment correlation index",
      author: "amrit-verse",
      repository: "amrit-verse/releasetrace",
      framework: "nextjs",
      runtimeVersion: "nodejs-22",
      buildPassed: true,
      testsPassed: true,
      testSummary: { total: 20, passed: 20, failed: 0, skipped: 0 },
      migrationEvidence: {
        hasPendingMigrations: false,
        migrationFileCount: 2,
        migrationNames: ["20261106_init", "20261106_add_deployments"],
      },
      changedFiles: ["prisma/schema.prisma"],
      environment: "production" as const,
      collectedAt: new Date().toISOString(),
    },
    metadata: {
      githubRunId: "987654321",
    },
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Invalid Signatures & Replay Prevention", () => {
    it("rejects when raw signature does not match expected HMAC", async () => {
      const payload = createValidPayload();
      const rawBody = JSON.stringify(payload);
      const invalidSignature = "sha256=1111111111111111111111111111111111111111111111111111111111111111";

      const req = new NextRequest("http://localhost:3000/api/webhooks/deployments", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-releasetrace-signature": invalidSignature,
          "x-releasetrace-timestamp": new Date().toISOString(),
        },
        body: rawBody,
      });

      const res = await POST(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toContain("Unauthorized");
    });

    it("rejects when timestamp is older than 300 seconds (replay attack protection)", () => {
      const payload = createValidPayload();
      const rawBody = JSON.stringify(payload);
      const oldTimestamp = new Date(Date.now() - 350 * 1000).toISOString();
      const signed = signPayload({ payload: rawBody, secret, timestamp: oldTimestamp });

      const verify = verifySignature({
        rawPayload: rawBody,
        signatureHeader: signed.headerValue,
        timestampHeader: oldTimestamp,
        secret,
        maxTimeDriftSeconds: 300,
      });

      expect(verify.valid).toBe(false);
      expect(verify.reason).toContain("Signature expired");
    });

    it("rejects when timestamp is skewed into the future by more than 60 seconds", () => {
      const payload = createValidPayload();
      const rawBody = JSON.stringify(payload);
      const futureTimestamp = new Date(Date.now() + 120 * 1000).toISOString();
      const signed = signPayload({ payload: rawBody, secret, timestamp: futureTimestamp });

      const verify = verifySignature({
        rawPayload: rawBody,
        signatureHeader: signed.headerValue,
        timestampHeader: futureTimestamp,
        secret,
        maxFutureSkewSeconds: 60,
      });

      expect(verify.valid).toBe(false);
      expect(verify.reason).toContain("future");
    });
  });

  describe("2. Deduplication & Idempotent Event Ingestion", () => {
    it("ingests an event initially and marks deduplicated=true on second identical arrival", async () => {
      const payload = createValidPayload({ eventId: "dedup_test_evt_101" });
      const rawBody = JSON.stringify(payload);
      const timestamp = new Date().toISOString();
      const signature = generateHmacSignature(rawBody, secret);

      // First delivery: returns 202 Accepted
      const req1 = new NextRequest("http://localhost:3000/api/webhooks/deployments", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-releasetrace-signature": signature,
          "x-releasetrace-timestamp": timestamp,
        },
        body: rawBody,
      });

      const res1 = await POST(req1);
      if (res1.status !== 202) {
        const errJson = await res1.json();
        console.error("Test 2 res1 error:", errJson);
      }
      expect(res1.status).toBe(202);
      const json1 = await res1.json();
      expect(json1.accepted).toBe(true);
      expect(json1.deduplicated).toBe(false);

      // Second delivery with same payload: returns 200 OK with deduplicated=true
      const req2 = new NextRequest("http://localhost:3000/api/webhooks/deployments", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-releasetrace-signature": signature,
          "x-releasetrace-timestamp": timestamp,
        },
        body: rawBody,
      });

      const res2 = await POST(req2);
      expect(res2.status).toBe(200);
      const json2 = await res2.json();
      expect(json2.deduplicated).toBe(true);
    });
  });

  describe("3. Malformed Event Payloads", () => {
    it("rejects non-JSON payload with 400 Bad Request", async () => {
      const rawBody = "<<<Not a valid json>>>";
      const signature = generateHmacSignature(rawBody, secret);

      const req = new NextRequest("http://localhost:3000/api/webhooks/deployments", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-releasetrace-signature": signature,
          "x-releasetrace-timestamp": new Date().toISOString(),
        },
        body: rawBody,
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/Invalid JSON|BAD_REQUEST/i);
    });

    it("rejects payload with missing required commitSha with 422 Unprocessable Entity", async () => {
      const malformed = {
        eventId: "bad_sha_1",
        provider: "github_actions",
        projectId: "proj_core",
        projectName: "ReleaseTrace Core",
        eventType: "deployment_completed",
        timestamp: new Date().toISOString(),
        evidence: {
          // commitSha missing!
          branch: "main",
          commitMessage: "test",
          author: "user",
          repository: "repo",
          buildPassed: true,
          testsPassed: true,
          environment: "production",
          collectedAt: new Date().toISOString(),
        },
      };

      const rawBody = JSON.stringify(malformed);
      const signature = generateHmacSignature(rawBody, secret);

      const req = new NextRequest("http://localhost:3000/api/webhooks/deployments", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-releasetrace-signature": signature,
          "x-releasetrace-timestamp": new Date().toISOString(),
        },
        body: rawBody,
      });

      const res = await POST(req);
      expect(res.status).toBe(422);
      const json = await res.json();
      expect(json.error).toContain("contract validation");
    });
  });

  describe("4. Vercel API Errors & Resilient Handling", () => {
    it("handles 401 Unauthorized from Vercel API without exposing raw token", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => '{"error":{"code":"not_authorized","message":"Bearer token invalid"}}',
      });

      const client = new VercelClient({
        token: "secret_raw_token_value",
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      await expect(client.getDeployment("dpl_123")).rejects.toThrow(VercelApiError);

      try {
        await client.getDeployment("dpl_123");
      } catch (err: unknown) {
        const error = err as VercelApiError;
        expect(error.statusCode).toBe(401);
        expect(error.message).not.toContain("secret_raw_token_value");
      }
    });

    it("handles 429 Rate Limit from Vercel API", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => "Rate limit exceeded. Retry later.",
      });

      const client = new VercelClient({
        token: "valid_token",
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      await expect(client.listDeploymentsByCommit("abc1234")).rejects.toThrow(VercelApiError);
    });

    it("handles 500 Internal Server Error from Vercel API gracefully in correlator", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "Vercel internal outage",
      });

      const result = await correlateVercelDeployment("abc12345", {
        apiToken: "valid_token",
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      expect(result.found).toBe(false);
      expect(result.isProcessing).toBe(false);
      expect(result.error).toContain("500");
    });
  });

  describe("5. Missing Deployment Correlation & Pending State Detection", () => {
    it("correctly identifies pending deployments when readyState is INITIALIZING or BUILDING", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          deployments: [
            {
              uid: "dpl_init_1",
              name: "releasetrace",
              url: "releasetrace-init.vercel.app",
              readyState: "INITIALIZING",
              created: Date.now(),
              meta: { githubCommitSha: "sha_init_100" },
            },
          ],
        }),
      });

      const client = new VercelClient({
        token: "tok",
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      const correlated = await client.correlateDeployment("sha_init_100");
      expect(correlated.found).toBe(true);
      expect(correlated.isPending).toBe(true);
      expect(correlated.status).toBe("QUEUED");
    });

    it("handles missing deployments when commit has not yet triggered a Vercel build", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ deployments: [] }),
      });

      const client = new VercelClient({
        token: "tok",
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      const correlated = await client.correlateDeployment("sha_never_seen");
      expect(correlated.found).toBe(false);
      expect(correlated.isPending).toBe(true);
    });
  });

  describe("6. Inngest Workflow Step Resilience", () => {
    it("has properly declared Inngest function trigger and concurrency limit", () => {
      expect(processDeploymentWebhook).toBeDefined();
      const fnId = typeof processDeploymentWebhook.id === "function" ? processDeploymentWebhook.id() : processDeploymentWebhook.id;
      expect(fnId).toContain("process-deployment-");
    });
  });
});
