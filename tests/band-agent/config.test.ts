import { describe, it, expect } from "vitest";
import {
  getBandAgentConfig,
  probeEnvironmentHealth,
  RELEASE_TRACE_AGENT_NAME,
  RELEASE_TRACE_AGENT_DESCRIPTION,
} from "@/band-agent/config";

describe("Band Agent: Configuration & Probing", () => {
  it("exports official agent display identity", () => {
    expect(RELEASE_TRACE_AGENT_NAME).toBe("ReleaseTrace AI");
    expect(RELEASE_TRACE_AGENT_DESCRIPTION).toContain(
      "An Agy-built, ReleaseTrace-powered engineering intelligence agent"
    );
  });

  it("throws clear diagnostic error when BAND_AGENT_ID or BAND_API_KEY is missing", () => {
    expect(() => getBandAgentConfig({})).toThrow(
      /Missing required Band credentials/i
    );
    expect(() =>
      getBandAgentConfig({ BAND_AGENT_ID: "test-id" })
    ).toThrow(/Missing required Band credentials/i);
  });

  it("loads valid credentials from environment object", () => {
    const config = getBandAgentConfig({
      BAND_AGENT_ID: "88c17522-11f9-4ea7-bcd4-4cd09541c121",
      BAND_API_KEY: "test-api-key-value-1234567890",
    });

    expect(config.agentId).toBe("88c17522-11f9-4ea7-bcd4-4cd09541c121");
    expect(config.apiKey).toBe("test-api-key-value-1234567890");
  });

  it("probes health correctly reporting unconfigured services without crashing", () => {
    const health = probeEnvironmentHealth({});
    expect(health.band.configured).toBe(false);
    expect(health.database.configured).toBe(false);
    expect(health.hindsight.mode).toBe("mock");
    expect(health.groq.configured).toBe(false);
  });

  it("probes health correctly when services are configured", () => {
    const health = probeEnvironmentHealth({
      BAND_AGENT_ID: "88c17522-11f9-4ea7-bcd4-4cd09541c121",
      BAND_API_KEY: "secret",
      DATABASE_URL: "postgresql://localhost:5432/db",
      HINDSIGHT_API_KEY: "hs-secret",
      GROQ_API_KEY: "gsk-secret",
    });

    expect(health.band.configured).toBe(true);
    expect(health.database.configured).toBe(true);
    expect(health.hindsight.mode).toBe("cloud");
    expect(health.groq.configured).toBe(true);
  });
});
