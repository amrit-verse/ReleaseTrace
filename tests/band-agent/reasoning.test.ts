import { describe, it, expect, beforeEach, vi } from "vitest";
import { ReleaseTraceReasoningEngine } from "@/band-agent/reasoning";

vi.mock("@/lib/db", () => ({
  prisma: {
    deployment: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
  },
}));

describe("Band Agent: Reasoning Engine", () => {
  let reasoning: ReleaseTraceReasoningEngine;

  beforeEach(() => {
    reasoning = new ReleaseTraceReasoningEngine();
  });

  it("classifies intent for deployment investigations", () => {
    const match = reasoning.classifyIntent("Investigate why this deployment 0968965c-cc18-4923-938a-92aaa8f79a88 received a HIGH risk assessment");
    expect(match.intent).toBe("INVESTIGATE_DEPLOYMENT");
    expect(match.extractedParams.deploymentId).toBe("0968965c-cc18-4923-938a-92aaa8f79a88");
  });

  it("classifies intent for architecture explanations", () => {
    const match = reasoning.classifyIntent("Explain the ReleaseTrace architecture");
    expect(match.intent).toBe("EXPLAIN_ARCHITECTURE");
  });

  it("classifies intent for release assessment requests", () => {
    const match = reasoning.classifyIntent("Assess release with migration: ALTER TABLE users ADD COLUMN age INT;");
    expect(match.intent).toBe("ASSESS_RELEASE");
  });

  it("classifies intent for deterministic safety rules", () => {
    const match = reasoning.classifyIntent("What deterministic rules do you enforce?");
    expect(match.intent).toBe("EXPLAIN_RULES");
  });

  it("classifies intent for abstention queries", () => {
    const match = reasoning.classifyIntent("Why did you abstain from using memory?");
    expect(match.intent).toBe("EXPLAIN_ABSTENTION");
  });

  it("handles architecture explanation returning multi-tier system breakdown", async () => {
    const result = await reasoning.handleMessage("Explain ReleaseTrace architecture");
    expect(result.text).toContain("ReleaseTrace Architecture Overview");
    expect(result.text).toContain("Deterministic Rule Engine");
    expect(result.text).toContain("Hindsight Cloud");
    expect(result.text).toContain("Environment Comparator");
  });

  it("handles deterministic rules query returning registry and invariants", async () => {
    const result = await reasoning.handleMessage("Explain deterministic rules");
    expect(result.text).toContain("Deterministic Risk Rules Registry");
    expect(result.text).toContain("RT-RULE-001");
  });

  it("handles memory abstention query adhering to core SRE principle", async () => {
    const result = await reasoning.handleMessage("Why does the engine abstain?");
    expect(result.text).toContain("Abstention Gates");
    expect(result.text).toContain("Hindsight memory informs. Current evidence verifies. The engineer decides.");
  });

  it("refuses to fabricate non-existent deployments", async () => {
    const result = await reasoning.handleMessage("Investigate deployment 00000000-0000-0000-0000-000000000000");
    expect(result.text).toContain("Refused to fabricate missing deployment records");
    expect(result.text).toContain("Required Evidence: Valid deployment ID");
  });

  it("evaluates a release assessment using real intelligence engine", async () => {
    const result = await reasoning.handleMessage("Assess release with migration on production");
    expect(result.text).toContain("Release Assessment Result");
    expect(result.text).toContain("Verified Current Evidence");
    expect(result.text).toContain("Deterministic Rule Findings");
    expect(result.structured?.metadata?.intent).toBe("ASSESS_RELEASE");
  });

  it("provides collaborative code review help for peer agents", async () => {
    const result = await reasoning.handleMessage("Can you help Code Reviewer check this migration?", "Code Reviewer");
    expect(result.text).toContain("Hello Code Reviewer.");
    expect(result.text).toContain("Code Author");
    expect(result.text).toContain("lock_timeout");
  });
});
