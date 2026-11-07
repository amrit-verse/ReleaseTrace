import { NextResponse } from "next/server";
import { HindsightAdapter } from "@/intelligence/hindsight/adapter";
import { GroqAdapter } from "@/intelligence/llm/groq-adapter";
import { db } from "@/lib/db";

export type IntegrationStatus =
  | "CONNECTED"
  | "NOT_CONFIGURED"
  | "UNAVAILABLE"
  | "AUTHENTICATION_FAILED"
  | "MOCK_MODE"
  | "CONFIGURED";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetId = searchParams.get("id");

  const results: Record<
    string,
    {
      status: IntegrationStatus;
      latencyMs: number;
      lastHeartbeat: string;
      error?: string;
    }
  > = {};

  // 1. Hindsight: actual getVersion() live provider check
  if (!targetId || targetId === "hindsight") {
    if (!process.env.HINDSIGHT_API_KEY) {
      results.hindsight = {
        status: "MOCK_MODE",
        latencyMs: 0,
        lastHeartbeat: new Date().toISOString(),
      };
    } else {
      const start = Date.now();
      try {
        const adapter = HindsightAdapter.getInstance();
        const health = await adapter.checkHealth();
        const latencyMs = Date.now() - start;

        if (health.isMock) {
          results.hindsight = {
            status: "MOCK_MODE",
            latencyMs: 0,
            lastHeartbeat: new Date().toISOString(),
          };
        } else if (health.isHealthy) {
          results.hindsight = {
            status: "CONNECTED",
            latencyMs,
            lastHeartbeat: new Date().toISOString(),
          };
        } else if (
          health.error?.toLowerCase().includes("auth") ||
          health.error?.toLowerCase().includes("unauthorized") ||
          health.error?.toLowerCase().includes("key")
        ) {
          results.hindsight = {
            status: "AUTHENTICATION_FAILED",
            latencyMs,
            lastHeartbeat: new Date().toISOString(),
            error: health.error,
          };
        } else {
          results.hindsight = {
            status: "UNAVAILABLE",
            latencyMs,
            lastHeartbeat: new Date().toISOString(),
            error: health.error,
          };
        }
      } catch (err: unknown) {
        results.hindsight = {
          status: "UNAVAILABLE",
          latencyMs: Date.now() - start,
          lastHeartbeat: new Date().toISOString(),
          error: err instanceof Error ? err.message : String(err),
        };
      }
    }
  }

  // 2. Groq: authenticated provider health request
  if (!targetId || targetId === "groq") {
    if (!process.env.GROQ_API_KEY) {
      results.groq = {
        status: "NOT_CONFIGURED",
        latencyMs: 0,
        lastHeartbeat: new Date().toISOString(),
      };
    } else {
      const start = Date.now();
      try {
        const adapter = new GroqAdapter();
        const health = await adapter.checkHealth();
        const latencyMs = Date.now() - start;
        if (health.isMock) {
          results.groq = {
            status: "MOCK_MODE",
            latencyMs: 0,
            lastHeartbeat: new Date().toISOString(),
          };
        } else if (health.isHealthy) {
          results.groq = {
            status: "CONNECTED",
            latencyMs,
            lastHeartbeat: new Date().toISOString(),
          };
        } else if (
          health.error?.toLowerCase().includes("auth") ||
          health.error?.toLowerCase().includes("api key")
        ) {
          results.groq = {
            status: "AUTHENTICATION_FAILED",
            latencyMs,
            lastHeartbeat: new Date().toISOString(),
            error: health.error,
          };
        } else {
          results.groq = {
            status: "UNAVAILABLE",
            latencyMs,
            lastHeartbeat: new Date().toISOString(),
            error: health.error,
          };
        }
      } catch (err: unknown) {
        results.groq = {
          status: "UNAVAILABLE",
          latencyMs: Date.now() - start,
          lastHeartbeat: new Date().toISOString(),
          error: err instanceof Error ? err.message : String(err),
        };
      }
    }
  }

  // 3. Neon PostgreSQL: actual SELECT 1 probe
  if (!targetId || targetId === "neon") {
    if (!process.env.DATABASE_URL) {
      results.neon = {
        status: "NOT_CONFIGURED",
        latencyMs: 0,
        lastHeartbeat: new Date().toISOString(),
      };
    } else {
      const start = Date.now();
      try {
        await db.$queryRaw`SELECT 1`;
        results.neon = {
          status: "CONNECTED",
          latencyMs: Date.now() - start,
          lastHeartbeat: new Date().toISOString(),
        };
      } catch (err: unknown) {
        results.neon = {
          status: "UNAVAILABLE",
          latencyMs: Date.now() - start,
          lastHeartbeat: new Date().toISOString(),
          error: err instanceof Error ? err.message : "Database ping failed",
        };
      }
    }
  }

  // 4. Vercel: authenticated API request
  if (!targetId || targetId === "vercel") {
    const vercelToken =
      process.env.VERCEL_API_TOKEN || process.env.VERCEL_TOKEN;
    if (!vercelToken) {
      results.vercel = {
        status: "NOT_CONFIGURED",
        latencyMs: 0,
        lastHeartbeat: new Date().toISOString(),
      };
    } else {
      const start = Date.now();
      try {
        const res = await fetch("https://api.vercel.com/v2/user", {
          headers: { Authorization: `Bearer ${vercelToken}` },
        });
        const latencyMs = Date.now() - start;
        if (res.ok) {
          results.vercel = {
            status: "CONNECTED",
            latencyMs,
            lastHeartbeat: new Date().toISOString(),
          };
        } else if (res.status === 401 || res.status === 403) {
          results.vercel = {
            status: "AUTHENTICATION_FAILED",
            latencyMs,
            lastHeartbeat: new Date().toISOString(),
            error: `HTTP ${res.status}: Unauthorized`,
          };
        } else {
          results.vercel = {
            status: "UNAVAILABLE",
            latencyMs,
            lastHeartbeat: new Date().toISOString(),
            error: `HTTP ${res.status}`,
          };
        }
      } catch (err: unknown) {
        results.vercel = {
          status: "UNAVAILABLE",
          latencyMs: Date.now() - start,
          lastHeartbeat: new Date().toISOString(),
          error: err instanceof Error ? err.message : "Vercel API connection failed",
        };
      }
    }
  }

  // 5. Inngest: truthful probe / configured status
  if (!targetId || targetId === "inngest") {
    const inngestBaseUrl = process.env.INNGEST_BASE_URL;
    if (inngestBaseUrl) {
      const start = Date.now();
      try {
        const res = await fetch(`${inngestBaseUrl}/x/v0/health`);
        const latencyMs = Date.now() - start;
        if (res.ok) {
          results.inngest = {
            status: "CONNECTED",
            latencyMs,
            lastHeartbeat: new Date().toISOString(),
          };
        } else {
          results.inngest = {
            status: "UNAVAILABLE",
            latencyMs,
            lastHeartbeat: new Date().toISOString(),
            error: `HTTP ${res.status}`,
          };
        }
      } catch (err: unknown) {
        results.inngest = {
          status: "UNAVAILABLE",
          latencyMs: Date.now() - start,
          lastHeartbeat: new Date().toISOString(),
          error: err instanceof Error ? err.message : "Inngest probe failed",
        };
      }
    } else if (
      process.env.INNGEST_EVENT_KEY ||
      process.env.INNGEST_SIGNING_KEY
    ) {
      // Keys are configured, but no active network probe executed
      results.inngest = {
        status: "CONFIGURED",
        latencyMs: 0,
        lastHeartbeat: new Date().toISOString(),
      };
    } else {
      results.inngest = {
        status: "NOT_CONFIGURED",
        latencyMs: 0,
        lastHeartbeat: new Date().toISOString(),
      };
    }
  }

  // 6. GitHub: truthful probe if token exists, or CONFIGURED if webhook secret exists
  if (!targetId || targetId === "github") {
    const githubToken = process.env.GITHUB_TOKEN;
    const webhookSecret =
      process.env.RELEASETRACE_WEBHOOK_SECRET ||
      process.env.RELESETRACE_WEBHOOK_SECRET;

    if (githubToken) {
      const start = Date.now();
      try {
        const res = await fetch("https://api.github.com/octocat", {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            "User-Agent": "ReleaseTrace-Health-Probe/1.0",
          },
        });
        const latencyMs = Date.now() - start;
        if (res.ok) {
          results.github = {
            status: "CONNECTED",
            latencyMs,
            lastHeartbeat: new Date().toISOString(),
          };
        } else if (res.status === 401 || res.status === 403) {
          results.github = {
            status: "AUTHENTICATION_FAILED",
            latencyMs,
            lastHeartbeat: new Date().toISOString(),
            error: `HTTP ${res.status}: Invalid token`,
          };
        } else {
          results.github = {
            status: "UNAVAILABLE",
            latencyMs,
            lastHeartbeat: new Date().toISOString(),
            error: `HTTP ${res.status}`,
          };
        }
      } catch (err: unknown) {
        results.github = {
          status: "UNAVAILABLE",
          latencyMs: Date.now() - start,
          lastHeartbeat: new Date().toISOString(),
          error: err instanceof Error ? err.message : "GitHub probe failed",
        };
      }
    } else if (webhookSecret) {
      // Webhook secret exists for incoming HMAC verification, but no outbound API token
      results.github = {
        status: "CONFIGURED",
        latencyMs: 0,
        lastHeartbeat: new Date().toISOString(),
      };
    } else {
      results.github = {
        status: "NOT_CONFIGURED",
        latencyMs: 0,
        lastHeartbeat: new Date().toISOString(),
      };
    }
  }

  return NextResponse.json({ results });
}
