/**
 * ReleaseTrace AI Band Agent - Configuration & Credential Management
 */

import { loadAgentConfigFromEnv, type AgentCredentials } from "@band-ai/sdk";

export const RELEASE_TRACE_AGENT_NAME = "ReleaseTrace AI";

export const RELEASE_TRACE_AGENT_DESCRIPTION =
  "An Agy-built, ReleaseTrace-powered engineering intelligence agent. Investigates deployment risks, recalls verified historical engineering experiences, compares release environments, explains technical findings, and collaborates with engineers and other agents.";

export const RELEASE_TRACE_DEFAULT_ROOM_ID = "72db800d-4453-4041-8a2e-0a85ae4c4ea2";

export interface EnvironmentHealth {
  band: {
    configured: boolean;
    agentId?: string;
    hasApiKey: boolean;
    wsUrl?: string;
  };
  database: {
    configured: boolean;
    provider: "neon-postgresql" | "unconfigured";
  };
  hindsight: {
    configured: boolean;
    mode: "cloud" | "mock";
    bankPrefix: string;
  };
  groq: {
    configured: boolean;
    model: string;
  };
  inngest: {
    configured: boolean;
  };
}

/**
 * Loads and validates Band agent credentials from environment variables.
 * Uses official @band-ai/sdk `loadAgentConfigFromEnv()`.
 */
export function getBandAgentConfig(env: Record<string, string | undefined> = process.env): AgentCredentials {
  const agentId = env.BAND_AGENT_ID || env.THENVOI_AGENT_ID;
  const apiKey = env.BAND_API_KEY || env.THENVOI_API_KEY;

  if (!agentId || !apiKey) {
    throw new Error(
      "Missing required Band credentials. Set BAND_AGENT_ID and BAND_API_KEY in your environment or .env file.\n" +
        "You can register an agent in app.band.ai (Agents -> Create 'External' Agent) to obtain these credentials."
    );
  }

  return loadAgentConfigFromEnv({ env });
}

/**
 * Probes environment configurations for ReleaseTrace integrations.
 */
export function probeEnvironmentHealth(env: Record<string, string | undefined> = process.env): EnvironmentHealth {
  const hasBandId = Boolean(env.BAND_AGENT_ID || env.THENVOI_AGENT_ID);
  const hasBandKey = Boolean(env.BAND_API_KEY || env.THENVOI_API_KEY);

  const hasDb = Boolean(env.DATABASE_URL);
  const hasHindsightKey = Boolean(env.HINDSIGHT_API_KEY && env.HINDSIGHT_API_KEY.trim() !== "");
  const hindsightMock = env.HINDSIGHT_USE_MOCK === "true" || !hasHindsightKey;
  const hasGroq = Boolean(env.GROQ_API_KEY && env.GROQ_API_KEY.trim() !== "");

  return {
    band: {
      configured: hasBandId && hasBandKey,
      agentId: env.BAND_AGENT_ID || env.THENVOI_AGENT_ID,
      hasApiKey: hasBandKey,
      wsUrl: env.BAND_WS_URL,
    },
    database: {
      configured: hasDb,
      provider: hasDb ? "neon-postgresql" : "unconfigured",
    },
    hindsight: {
      configured: hasHindsightKey || hindsightMock,
      mode: hindsightMock ? "mock" : "cloud",
      bankPrefix: env.HINDSIGHT_BANK_PREFIX || "releasetrace",
    },
    groq: {
      configured: hasGroq,
      model: env.GROQ_MODEL || "openai/gpt-oss-120b",
    },
    inngest: {
      configured: Boolean(env.INNGEST_EVENT_KEY || env.INNGEST_SIGNING_KEY),
    },
  };
}
