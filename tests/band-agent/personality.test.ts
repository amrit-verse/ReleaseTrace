import { describe, it, expect } from "vitest";
import {
  RELEASE_TRACE_CORE_PRINCIPLE,
  SRE_SYSTEM_PROMPT,
  formatSreResponse,
} from "@/band-agent/personality";
import type { StructuredSreResponse } from "@/band-agent/types";

describe("Band Agent: Personality & Formatting", () => {
  it("maintains the core SRE operational principle", () => {
    expect(RELEASE_TRACE_CORE_PRINCIPLE).toBe(
      "Hindsight memory informs. Current evidence verifies. The engineer decides."
    );
    expect(SRE_SYSTEM_PROMPT).toContain(RELEASE_TRACE_CORE_PRINCIPLE);
  });

  it("formats structured responses distinguishing all 5 required sections", () => {
    const mockResponse: StructuredSreResponse = {
      summary: "🛡️ Assessment Complete: HIGH Risk Detected.",
      verifiedCurrentEvidence: [
        "Git diff adds unindexed foreign key migration.",
        "Connection pool saturation at 82%.",
      ],
      historicalMemory: {
        memoryState: "QUALIFIED_MEMORIES_USED",
        recalledPrecedentsCount: 1,
        topMatches: ["Precedent mem-001: Connection exhaustion during checkout surge"],
        divergenceNotes: "Production has 20 replicas while precedent was tested with 2.",
      },
      deterministicRuleFindings: {
        evaluatedRulesCount: 8,
        violations: [
          {
            ruleId: "RT-RULE-002",
            description: "Unsafe migration lock guard",
            riskLevel: "HIGH",
          },
        ],
        hardBlocked: false,
      },
      aiExplanation: "The combination of migration table locks and elevated pool saturation threatens service latency.",
      recommendedNextActions: [
        "Set lock_timeout to 3s before executing migration.",
        "Verify read-replica health prior to deployment.",
      ],
    };

    const formatted = formatSreResponse(mockResponse);

    expect(formatted).toContain("🛡️ Assessment Complete: HIGH Risk Detected.");
    expect(formatted).toContain("**1. Verified Current Evidence:**");
    expect(formatted).toContain("- Git diff adds unindexed foreign key migration.");
    expect(formatted).toContain("**2. Historical Memory (Hindsight):**");
    expect(formatted).toContain("QUALIFIED_MEMORIES_USED");
    expect(formatted).toContain("Divergence Warning");
    expect(formatted).toContain("**3. Deterministic Rule Findings:**");
    expect(formatted).toContain("RT-RULE-002");
    expect(formatted).toContain("**4. AI-Generated Explanation:**");
    expect(formatted).toContain("The combination of migration table locks");
    expect(formatted).toContain("**5. Recommended Next Action:**");
    expect(formatted).toContain("Set lock_timeout to 3s");
  });
});
