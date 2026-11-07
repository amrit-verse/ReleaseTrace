/**
 * Structured Output Zod Validation Schemas for LLM Assessments
 * 
 * Enforces strict typing and validation on all LLM outputs.
 */

import { z } from 'zod';

export const RecalledMemoryCitationSchema = z.object({
  memoryId: z.string(),
  confirmedRootCause: z.string(),
  verifiedMitigation: z.string(),
  historicalConditions: z.string(),
  relevanceScore: z.number().min(0).max(1),
  environmentMatchScore: z.number().min(0).max(1),
  confirmedBy: z.string(),
  confirmedAt: z.string(),
});

export const ContradictionReportSchema = z.object({
  topic: z.string(),
  description: z.string(),
  resolutionGuidance: z.string(),
});

export const AssessmentRecommendationSchema = z.object({
  action: z.string().min(5),
  priority: z.enum(['IMMEDIATE', 'PRE_DEPLOY', 'MONITOR']),
  rationale: z.string().min(10),
  source: z.enum(['VERIFIED_MEMORY', 'DETERMINISTIC_RULE', 'CURRENT_EVIDENCE_ANALYSIS']),
  memoryReference: z.object({
    memoryId: z.string(),
    confirmedBy: z.string(),
    confirmedAt: z.string(),
  }).nullable().optional(),
  conditionNotice: z.string().nullable().optional(),
  divergenceWarning: z.string().nullable().optional(),
});

export const LlmAssessmentOutputSchema = z.object({
  summary: z.string().min(10),
  overallRisk: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  abstentionState: z.enum([
    'ACCUMULATED_EXPERIENCE',
    'ABSTAINED_NO_RELEVANT_MEMORIES',
    'ABSTAINED_WEAK_RECALL',
  ]),
  abstentionReason: z.string().nullable().optional(),
  recalledMemoriesUsed: z.array(RecalledMemoryCitationSchema).default([]),
  environmentMismatchAnalysis: z.string().nullable().optional(),
  contradictionsIdentified: z.array(ContradictionReportSchema).default([]),
  currentEvidenceObservations: z.array(z.string()).default([]),
  recommendations: z.array(AssessmentRecommendationSchema).min(1),
});

export type LlmAssessmentOutput = z.infer<typeof LlmAssessmentOutputSchema>;
