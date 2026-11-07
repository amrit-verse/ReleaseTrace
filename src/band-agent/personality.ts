/**
 * ReleaseTrace AI Band Agent - System Personality & SRE Formatting
 */

import type { StructuredSreResponse } from "./types";

export const RELEASE_TRACE_CORE_PRINCIPLE =
  "Hindsight memory informs. Current evidence verifies. The engineer decides.";

export const SRE_SYSTEM_PROMPT = `
You are ReleaseTrace AI, a Senior Site Reliability Engineer (SRE) and Release-Intelligence specialist.
You operate as a native AI participant in Band collaborative workspaces, alongside peer agents (Code Reviewer, Code Author, Express Lead, Delivery Manager) and human engineers.

CORE OPERATIONAL PRINCIPLE:
"${RELEASE_TRACE_CORE_PRINCIPLE}"

YOUR PROFESSIONAL CHARACTERISTICS:
1. Technically Precise: You focus on exact database engines, connection pool saturation, thread contention, migration lock timeouts, and git diff statistics.
2. Calm & Professional: Even when release risk is CRITICAL, you provide objective, actionable forensic observations without panic.
3. Collaborative with Peer Agents: You offer clear, structured evidence to help Code Reviewers verify PRs and Code Authors write safe migrations.
4. Concise by Default, Detailed When Asked: State the core verdict and primary risk upfront. Provide granular forensic detail when asked.
5. Question Weak Assumptions: If a user claims a migration is safe without providing index directives or lock timeouts, challenge that assumption calmly.
6. Transparent About Uncertainty: If historical memory is empty or weakly matched, say so explicitly. Never fabricate precedent.
7. Truth in Execution: Never claim to have deployed, blocked, or altered infrastructure if you only evaluated risk.

RESPONSE DISCIPLINE:
When answering technical release investigations or risk evaluations, you MUST distinguish between:
1. Verified Current Evidence (Telemetry, Git Diff, Target Environment)
2. Historical Memory (Hindsight Recall, Precedents, Divergence, or Abstention)
3. Deterministic Rule Findings (Hard Safety Invariants)
4. AI-Generated Explanation (Contextual Synthesis)
5. Recommended Next Action (Actionable Mitigation)
`.trim();

/**
 * Formats a structured SRE response into crisp, markdown text for Band chat rooms.
 */
export function formatSreResponse(response: StructuredSreResponse): string {
  const parts: string[] = [];

  // 1. Executive Summary
  parts.push(response.summary);

  // 2. Verified Current Evidence
  if (response.verifiedCurrentEvidence && response.verifiedCurrentEvidence.length > 0) {
    parts.push(`\n**1. Verified Current Evidence:**`);
    for (const ev of response.verifiedCurrentEvidence) {
      parts.push(`- ${ev}`);
    }
  }

  // 3. Historical Memory
  if (response.historicalMemory) {
    parts.push(`\n**2. Historical Memory (Hindsight):**`);
    parts.push(`- Status: \`${response.historicalMemory.memoryState}\``);
    parts.push(
      `- Consulted Precedents: ${response.historicalMemory.recalledPrecedentsCount} record(s)`
    );
    if (response.historicalMemory.topMatches && response.historicalMemory.topMatches.length > 0) {
      for (const m of response.historicalMemory.topMatches) {
        parts.push(`  * ${m}`);
      }
    }
    if (response.historicalMemory.divergenceNotes) {
      parts.push(`- Divergence Warning: ${response.historicalMemory.divergenceNotes}`);
    }
  }

  // 4. Deterministic Rule Findings
  if (response.deterministicRuleFindings) {
    parts.push(`\n**3. Deterministic Rule Findings:**`);
    const { violations, evaluatedRulesCount, hardBlocked } =
      response.deterministicRuleFindings;
    parts.push(
      `- Rules Evaluated: ${evaluatedRulesCount} | Hard Block: ${
        hardBlocked ? "**YES (HALT REQUIRED)**" : "NO"
      }`
    );
    if (violations.length === 0) {
      parts.push(`- No deterministic safety rule violations detected.`);
    } else {
      for (const v of violations) {
        parts.push(`- [${v.riskLevel}] \`${v.ruleId}\`: ${v.description}`);
      }
    }
  }

  // 5. AI-Generated Explanation
  if (response.aiExplanation) {
    parts.push(`\n**4. AI-Generated Explanation:**`);
    parts.push(response.aiExplanation);
  }

  // 6. Recommended Next Action
  if (response.recommendedNextActions && response.recommendedNextActions.length > 0) {
    parts.push(`\n**5. Recommended Next Action:**`);
    for (const action of response.recommendedNextActions) {
      parts.push(`- ${action}`);
    }
  }

  return parts.join("\n");
}
