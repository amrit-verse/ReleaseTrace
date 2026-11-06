import { NextResponse } from "next/server";
import { HindsightAdapter } from "@/intelligence/hindsight/adapter";
import { GroqAdapter } from "@/intelligence/llm/groq-adapter";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetId = searchParams.get("id");

  const results: Record<string, {
    status: "CONNECTED" | "NOT_CONFIGURED" | "UNAVAILABLE" | "AUTHENTICATION_FAILED" | "MOCK_MODE";
    latencyMs: number;
    lastHeartbeat: string;
    error?: string;
  }> = {};

  // 1. Hindsight
  if (!targetId || targetId === "hindsight") {
    const start = Date.now();
    try {
      const adapter = HindsightAdapter.getInstance();
      const health = await adapter.checkHealth();
      const latencyMs = Date.now() - start;

      if (health.isMock) {
        results.hindsight = { status: "MOCK_MODE", latencyMs, lastHeartbeat: new Date().toISOString() };
      } else if (health.isHealthy) {
        results.hindsight = { status: "CONNECTED", latencyMs, lastHeartbeat: new Date().toISOString() };
      } else if (health.error?.toLowerCase().includes("auth") || health.error?.toLowerCase().includes("unauthorized") || health.error?.toLowerCase().includes("key")) {
        results.hindsight = { status: "AUTHENTICATION_FAILED", latencyMs, lastHeartbeat: new Date().toISOString(), error: health.error };
      } else {
        results.hindsight = { status: "UNAVAILABLE", latencyMs, lastHeartbeat: new Date().toISOString(), error: health.error };
      }
    } catch (err: any) {
      results.hindsight = {
        status: "UNAVAILABLE",
        latencyMs: Date.now() - start,
        lastHeartbeat: new Date().toISOString(),
        error: err?.message || String(err),
      };
    }
  }

  // 2. Groq
  if (!targetId || targetId === "groq") {
    const start = Date.now();
    if (!process.env.GROQ_API_KEY) {
      results.groq = { status: "NOT_CONFIGURED", latencyMs: 0, lastHeartbeat: new Date().toISOString() };
    } else {
      try {
        const adapter = new GroqAdapter();
        const health = await adapter.checkHealth();
        const latencyMs = Date.now() - start;
        if (health.isMock) {
          results.groq = { status: "MOCK_MODE", latencyMs, lastHeartbeat: new Date().toISOString() };
        } else if (health.isHealthy) {
          results.groq = { status: "CONNECTED", latencyMs, lastHeartbeat: new Date().toISOString() };
        } else if (health.error?.toLowerCase().includes("auth") || health.error?.toLowerCase().includes("api key")) {
          results.groq = { status: "AUTHENTICATION_FAILED", latencyMs, lastHeartbeat: new Date().toISOString(), error: health.error };
        } else {
          results.groq = { status: "UNAVAILABLE", latencyMs, lastHeartbeat: new Date().toISOString(), error: health.error };
        }
      } catch (err: any) {
        results.groq = {
          status: "UNAVAILABLE",
          latencyMs: Date.now() - start,
          lastHeartbeat: new Date().toISOString(),
          error: err?.message || String(err),
        };
      }
    }
  }

  // 3. Neon PostgreSQL
  if (!targetId || targetId === "neon") {
    const start = Date.now();
    if (!process.env.DATABASE_URL) {
      results.neon = { status: "NOT_CONFIGURED", latencyMs: 0, lastHeartbeat: new Date().toISOString() };
    } else {
      try {
        await db.$queryRaw`SELECT 1`;
        results.neon = { status: "CONNECTED", latencyMs: Date.now() - start, lastHeartbeat: new Date().toISOString() };
      } catch (err: any) {
        results.neon = {
          status: "UNAVAILABLE",
          latencyMs: Date.now() - start,
          lastHeartbeat: new Date().toISOString(),
          error: "Database ping failed",
        };
      }
    }
  }

  // 4. Vercel
  if (!targetId || targetId === "vercel") {
    const start = Date.now();
    const vercelToken = process.env.VERCEL_API_TOKEN || process.env.VERCEL_TOKEN;
    if (!vercelToken) {
      results.vercel = { status: "NOT_CONFIGURED", latencyMs: 0, lastHeartbeat: new Date().toISOString() };
    } else {
      try {
        const res = await fetch("https://api.vercel.com/v2/user", {
          headers: { Authorization: `Bearer ${vercelToken}` },
        });
        const latencyMs = Date.now() - start;
        if (res.ok) {
          results.vercel = { status: "CONNECTED", latencyMs, lastHeartbeat: new Date().toISOString() };
        } else if (res.status === 401 || res.status === 403) {
          results.vercel = { status: "AUTHENTICATION_FAILED", latencyMs, lastHeartbeat: new Date().toISOString() };
        } else {
          results.vercel = { status: "UNAVAILABLE", latencyMs, lastHeartbeat: new Date().toISOString() };
        }
      } catch (err: any) {
        results.vercel = {
          status: "UNAVAILABLE",
          latencyMs: Date.now() - start,
          lastHeartbeat: new Date().toISOString(),
          error: "Vercel API connection failed",
        };
      }
    }
  }

  // 5. Inngest
  if (!targetId || targetId === "inngest") {
    const start = Date.now();
    if (process.env.INNGEST_EVENT_KEY || process.env.INNGEST_SIGNING_KEY) {
      results.inngest = { status: "CONNECTED", latencyMs: Date.now() - start, lastHeartbeat: new Date().toISOString() };
    } else {
      results.inngest = { status: "MOCK_MODE", latencyMs: Date.now() - start, lastHeartbeat: new Date().toISOString() };
    }
  }

  // 6. GitHub Configuration
  if (!targetId || targetId === "github") {
    const start = Date.now();
    if (process.env.RELEASETRACE_WEBHOOK_SECRET) {
      results.github = { status: "CONNECTED", latencyMs: Date.now() - start, lastHeartbeat: new Date().toISOString() };
    } else {
      results.github = { status: "NOT_CONFIGURED", latencyMs: 0, lastHeartbeat: new Date().toISOString() };
    }
  }

  return NextResponse.json({ results });
}
