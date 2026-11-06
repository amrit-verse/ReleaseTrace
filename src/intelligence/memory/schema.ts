/**
 * Verified Engineering Memory Schema & Validation
 * 
 * Enforces the core ReleaseTrace invariants:
 * 1. Only engineer-confirmed outcomes may be retained as verified engineering experiences.
 * 2. Never treat an LLM hypothesis as a verified root cause.
 * 3. Never treat historical memory as current evidence.
 */

import { z } from 'zod';
import type { VerifiedEngineeringMemory } from '../types';

export class UnconfirmedMemoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnconfirmedMemoryError';
  }
}

export class InvalidMemorySchemaError extends Error {
  public validationErrors: z.ZodIssue[];

  constructor(message: string, issues: z.ZodIssue[]) {
    super(message);
    this.name = 'InvalidMemorySchemaError';
    this.validationErrors = issues;
  }
}

export const DatabaseConfigSchema = z.object({
  type: z.string().min(1),
  version: z.string().min(1),
  poolSize: z.number().int().positive().optional(),
  maxIdleTimeoutMs: z.number().int().nonnegative().optional(),
  statementTimeoutMs: z.number().int().nonnegative().optional(),
});

export const InfrastructureConfigSchema = z.object({
  provider: z.string().min(1),
  region: z.string().min(1),
  replicas: z.number().int().positive(),
  cpuLimit: z.string().optional(),
  memoryLimit: z.string().optional(),
});

export const EnvironmentConfigSchema = z.object({
  runtime: z.string().min(1),
  database: DatabaseConfigSchema,
  infrastructure: InfrastructureConfigSchema,
  featureFlags: z.record(z.union([z.boolean(), z.string()])).default({}),
  envVariables: z.record(z.string()).default({}),
  dependencies: z.record(z.string()).default({}),
});

export const EngineerConfirmationSchema = z.object({
  confirmedBy: z.string().min(3, "Engineer identifier must be at least 3 characters"),
  confirmedAt: z.string().datetime("confirmedAt must be an ISO-8601 timestamp"),
  isConfirmed: z.literal(true, {
    errorMap: () => ({ message: "isConfirmed must be explicitly true. Unconfirmed LLM hypotheses cannot be retained." }),
  }),
  confirmationMethod: z.enum(['manual_investigation', 'postmortem', 'runbook_resolution']),
  verificationEvidence: z.string().min(10, "Verification evidence must provide concrete forensic details"),
  notes: z.string().optional(),
});

export const FailureContextSchema = z.object({
  failureType: z.string().min(2),
  symptoms: z.array(z.string()).min(1, "At least one failure symptom must be documented"),
  errorSignatures: z.array(z.string()).default([]),
  logsSample: z.array(z.string()).default([]),
});

export const VerifiedEngineeringMemorySchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  deploymentId: z.string().min(1),
  service: z.string().min(1),
  createdAt: z.string().datetime(),
  environment: EnvironmentConfigSchema,
  failureContext: FailureContextSchema,
  confirmedRootCause: z.string().min(10, "Confirmed root cause must be substantive"),
  verifiedMitigation: z.string().min(10, "Verified mitigation must provide actionable remediation"),
  outcome: z.enum(['resolved', 'mitigated', 'rolled_back']),
  confirmation: EngineerConfirmationSchema,
  tags: z.array(z.string()).default([]),
});

export type VerifiedEngineeringMemoryInput = z.input<typeof VerifiedEngineeringMemorySchema>;

/**
 * Validates an object against the VerifiedEngineeringMemory schema.
 * Throws InvalidMemorySchemaError if validation fails.
 */
export function validateVerifiedMemory(input: unknown): VerifiedEngineeringMemory {
  const result = VerifiedEngineeringMemorySchema.safeParse(input);
  if (!result.success) {
    throw new InvalidMemorySchemaError(
      `Memory validation failed: ${result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`,
      result.error.issues
    );
  }
  return result.data as VerifiedEngineeringMemory;
}

/**
 * Gatekeeper function: strictly rejects any attempt to retain unconfirmed LLM hypotheses.
 */
export function assertEngineerConfirmation(memoryCandidate: {
  confirmation?: { isConfirmed?: boolean; confirmedBy?: string; verificationEvidence?: string };
  isHypothesis?: boolean;
}): void {
  if (memoryCandidate.isHypothesis === true) {
    throw new UnconfirmedMemoryError(
      "Rejected: Attempted to retain an AI/LLM hypothesis. Only engineer-confirmed root causes may be retained."
    );
  }

  if (!memoryCandidate.confirmation || memoryCandidate.confirmation.isConfirmed !== true) {
    throw new UnconfirmedMemoryError(
      "Rejected: Memory outcome lacks explicit engineer confirmation (isConfirmed must be true)."
    );
  }

  if (!memoryCandidate.confirmation.confirmedBy || memoryCandidate.confirmation.confirmedBy.trim().length < 3) {
    throw new UnconfirmedMemoryError(
      "Rejected: Missing engineer attribution for confirmed memory."
    );
  }

  if (!memoryCandidate.confirmation.verificationEvidence || memoryCandidate.confirmation.verificationEvidence.trim().length < 10) {
    throw new UnconfirmedMemoryError(
      "Rejected: Insufficient forensic verification evidence provided by engineer."
    );
  }
}

/**
 * Formats a verified engineering memory into structured markdown text for Hindsight retention.
 * Retains historical conditions and explicit engineer verification metadata.
 */
export function serializeMemoryToText(memory: VerifiedEngineeringMemory): string {
  const env = memory.environment;
  const db = env.database;
  const infra = env.infrastructure;

  return [
    `# VERIFIED ENGINEERING INCIDENT CASE: ${memory.id}`,
    `PROJECT: ${memory.projectId} | SERVICE: ${memory.service} | DEPLOYMENT: ${memory.deploymentId}`,
    `FAILURE TYPE: ${memory.failureContext.failureType}`,
    ``,
    `## ENGINEER CONFIRMATION (GROUND TRUTH)`,
    `- Confirmed By: ${memory.confirmation.confirmedBy}`,
    `- Confirmed At: ${memory.confirmation.confirmedAt}`,
    `- Verification Method: ${memory.confirmation.confirmationMethod}`,
    `- Forensic Evidence: ${memory.confirmation.verificationEvidence}`,
    `- Outcome: ${memory.outcome}`,
    ``,
    `## CONFIRMED ROOT CAUSE`,
    memory.confirmedRootCause,
    ``,
    `## VERIFIED MITIGATION`,
    memory.verifiedMitigation,
    ``,
    `## HISTORICAL CONDITIONS & ENVIRONMENT`,
    `- Runtime: ${env.runtime}`,
    `- Database: ${db.type} v${db.version} (Pool Size: ${db.poolSize ?? 'default'}, Idle Timeout: ${db.maxIdleTimeoutMs ?? 'default'}ms)`,
    `- Infrastructure: ${infra.provider} / ${infra.region} (${infra.replicas} replicas, CPU: ${infra.cpuLimit ?? 'n/a'}, Mem: ${infra.memoryLimit ?? 'n/a'})`,
    `- Error Signatures: ${memory.failureContext.errorSignatures.join(', ') || 'None'}`,
    `- Symptoms: ${memory.failureContext.symptoms.join('; ')}`,
  ].join('\n');
}
