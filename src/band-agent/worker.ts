/**
 * ReleaseTrace AI Band Agent - Dedicated Worker Process Manager
 */

import { Agent, type AgentCredentials } from "@band-ai/sdk";
import {
  RELEASE_TRACE_AGENT_NAME,
  RELEASE_TRACE_AGENT_DESCRIPTION,
  getBandAgentConfig,
  probeEnvironmentHealth,
  type EnvironmentHealth,
} from "./config";
import { createReleaseTraceAdapter, type AdapterOptions } from "./adapter";
import { DeduplicationTracker } from "./mention";
import { ReleaseTraceReasoningEngine } from "./reasoning";

export interface AgentInstance {
  agent: Agent;
  credentials: AgentCredentials;
  health: EnvironmentHealth;
  deduplicationTracker: DeduplicationTracker;
  reasoningEngine: ReleaseTraceReasoningEngine;
}

/**
 * Creates and configures the ReleaseTrace AI Band Agent instance.
 */
export function createReleaseTraceAgent(
  options: {
    env?: Record<string, string | undefined>;
    adapterOptions?: Partial<AdapterOptions>;
  } = {}
): AgentInstance {
  const env = options.env || process.env;
  const credentials = getBandAgentConfig(env);
  const health = probeEnvironmentHealth(env);

  const deduplicationTracker = new DeduplicationTracker();
  const reasoningEngine = new ReleaseTraceReasoningEngine();

  const adapter = createReleaseTraceAdapter({
    agentId: credentials.agentId,
    agentName: RELEASE_TRACE_AGENT_NAME,
    deduplicationTracker,
    reasoningEngine,
    ...options.adapterOptions,
  });

  const agent = Agent.create({
    adapter,
    config: credentials,
    identity: {
      name: RELEASE_TRACE_AGENT_NAME,
      description: RELEASE_TRACE_AGENT_DESCRIPTION,
    },
    agentConfig: {
      autoSubscribeExistingRooms: true,
    },
    sessionConfig: {
      enableWorkingState: true,
      workingKeepAliveSeconds: 3,
      workingRequestTimeoutSeconds: 2,
    },
  });

  return {
    agent,
    credentials,
    health,
    deduplicationTracker,
    reasoningEngine,
  };
}

/**
 * Starts and runs the ReleaseTrace AI Band Agent as an independent persistent process.
 */
export async function runWorker(env = process.env): Promise<void> {
  console.log("=".repeat(70));
  console.log("  ReleaseTrace AI — Dedicated Band Agent Worker");
  console.log("=".repeat(70));

  const health = probeEnvironmentHealth(env);
  console.log("\n[Environment Diagnostics]");
  console.log(`- Band Configured: ${health.band.configured ? "YES" : "NO"}`);
  console.log(`- Agent ID: ${health.band.agentId ? health.band.agentId : "UNSET"}`);
  console.log(`- Database (Neon): ${health.database.configured ? "ONLINE" : "OFFLINE"}`);
  console.log(`- Hindsight Memory: ${health.hindsight.mode.toUpperCase()} (Prefix: ${health.hindsight.bankPrefix})`);
  console.log(`- Groq LLM: ${health.groq.configured ? `ACTIVE (${health.groq.model})` : "MOCK/FALLBACK"}`);
  console.log(`- Inngest Workflows: ${health.inngest.configured ? "ONLINE" : "UNCONFIGURED"}`);

  if (!health.band.configured) {
    console.error("\n❌ ERROR: Band credentials not detected.");
    console.error("Please ensure BAND_AGENT_ID and BAND_API_KEY are configured in your environment or .env file.");
    process.exit(1);
  }

  let instance: AgentInstance;
  try {
    instance = createReleaseTraceAgent({ env });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`\n❌ Failed to initialize Band Agent: ${errMsg}`);
    process.exit(1);
  }

  console.log(`\n[Agent Identity]`);
  console.log(`- Display Name: ${RELEASE_TRACE_AGENT_NAME}`);
  console.log(`- Description: ${RELEASE_TRACE_AGENT_DESCRIPTION}`);
  console.log(`- Connecting to Band WebSocket runtime...`);

  // Handle graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n[ReleaseTrace AI] Received ${signal}. Shutting down worker gracefully...`);
    try {
      await instance.agent.stop(5000);
      console.log("[ReleaseTrace AI] Worker stopped cleanly.");
      process.exit(0);
    } catch (err) {
      console.error("[ReleaseTrace AI] Error during shutdown:", err);
      process.exit(1);
    }
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  try {
    // Connect and start the agent runtime
    await instance.agent.start();
    console.log(`[ReleaseTrace AI] Successfully connected to Band WebSocket runtime!`);
    console.log(`[ReleaseTrace AI] Agent status: ${instance.agent.state.status}`);
    console.log(`[ReleaseTrace AI] Listening for mentions in assigned Band rooms...\n`);

    // Keep running persistently
    await (instance.agent as any).platformRuntime.runForever();
  } catch (err: unknown) {
    console.error("\n❌ Band runtime encountered a fatal error:", err);
    process.exit(1);
  }
}
