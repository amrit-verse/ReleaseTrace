/**
 * ReleaseTrace AI Band Agent - Types
 */

export type { PlatformMessage } from "@band-ai/sdk";
import type { ReleaseAssessment } from "@/intelligence/types";

export type AgentIntent =
  | "EXPLAIN_ARCHITECTURE"
  | "EXPLAIN_LIFECYCLE"
  | "INVESTIGATE_DEPLOYMENT"
  | "ASSESS_RELEASE"
  | "EXPLAIN_RULES"
  | "COMPARE_ENVIRONMENTS"
  | "EXPLAIN_MEMORIES"
  | "EXPLAIN_CONTRADICTIONS"
  | "EXPLAIN_ABSTENTION"
  | "EXPLAIN_INTEGRATIONS"
  | "CODE_REVIEW_HELP"
  | "GENERAL_QUERY";

export interface IntentMatch {
  intent: AgentIntent;
  confidence: number;
  extractedParams: {
    deploymentId?: string;
    commitSha?: string;
    environment?: string;
    service?: string;
    query?: string;
    rawPayload?: Record<string, unknown>;
  };
}

export interface StructuredSreResponse {
  summary: string;
  verifiedCurrentEvidence: string[];
  historicalMemory?: {
    recalledPrecedentsCount: number;
    topMatches: string[];
    divergenceNotes?: string;
    memoryState: string;
  };
  deterministicRuleFindings?: {
    evaluatedRulesCount: number;
    violations: Array<{ ruleId: string; description: string; riskLevel: string }>;
    hardBlocked: boolean;
  };
  aiExplanation?: string;
  recommendedNextActions: string[];
  metadata?: {
    intent: AgentIntent;
    assessedAt: string;
    source: string;
  };
}

export interface HandlerResult {
  text: string;
  structured?: StructuredSreResponse;
  rawAssessment?: ReleaseAssessment;
}

export interface MentionCheckResult {
  isMentioned: boolean;
  isDirectMessage: boolean;
  cleanedContent: string;
  mentionedBy: {
    id: string;
    name?: string | null;
    type?: string;
  };
}
