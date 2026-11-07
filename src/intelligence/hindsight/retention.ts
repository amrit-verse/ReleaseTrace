/**
 * Retry-Safe Structured Retention Workflow
 * 
 * Enforces the core ReleaseTrace invariants:
 * 1. "Only engineer-confirmed outcomes may be retained as verified engineering experiences."
 * 2. "Never treat an LLM hypothesis as a verified root cause."
 * 3. "Retry-safe retention: Idempotent document identifiers prevent duplicate writes."
 */

import { HindsightAdapter } from './adapter';
import { ProjectMemoryBankManager } from './bank-manager';
import {
  validateVerifiedMemory,
  assertEngineerConfirmation,
  serializeMemoryToText,
  type VerifiedEngineeringMemoryInput,
} from '../memory/schema';
import type { VerifiedEngineeringMemory } from '../types';

export interface RetentionResult {
  success: boolean;
  bankId: string;
  documentId: string;
  memoryId: string;
  confirmedBy: string;
  confirmedAt: string;
  attemptCount: number;
}

export class ExperienceRetentionWorkflow {
  private adapter: HindsightAdapter;
  private bankManager: ProjectMemoryBankManager;

  constructor(adapter?: HindsightAdapter, bankManager?: ProjectMemoryBankManager) {
    this.adapter = adapter || HindsightAdapter.getInstance();
    this.bankManager = bankManager || new ProjectMemoryBankManager(this.adapter);
  }

  /**
   * Retains an engineer-confirmed deployment failure and mitigation into Hindsight.
   * Throws UnconfirmedMemoryError if engineer confirmation is missing.
   * Idempotent: repeated calls with the same memory ID or deployment ID safely overwrite/update.
   */
  public async retainVerifiedExperience(
    input: VerifiedEngineeringMemoryInput,
    options: { maxRetries?: number } = {}
  ): Promise<RetentionResult> {
    // Step 1: Strict Schema Validation
    const memory: VerifiedEngineeringMemory = validateVerifiedMemory(input);

    // Step 2: Invariant Gatekeeper - Must be confirmed by a human engineer
    assertEngineerConfirmation({
      confirmation: memory.confirmation,
      isHypothesis: false,
    });

    // Step 3: Ensure destination bank exists
    const bankId = await this.bankManager.ensureProjectBank(memory.projectId);

    // Step 4: Deterministic, retry-safe document ID
    const documentId = `case-${memory.projectId}-${memory.deploymentId}-${memory.id}`;

    // Step 5: Format structured prose representation
    const textContent = serializeMemoryToText(memory);

    // Step 6: Construct tags for index filtering
    const tags = Array.from(
      new Set([
        `service:${memory.service.toLowerCase()}`,
        `failure:${memory.failureContext.failureType.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}`,
        `db:${memory.environment.database.type.toLowerCase()}`,
        `db-v:${memory.environment.database.version.toLowerCase()}`,
        `confirmed:true`,
        `outcome:${memory.outcome}`,
        ...(memory.tags || []),
      ])
    );

    // Step 7: Construct metadata (including lossless JSON payload for faithful reconstruction)
    const metadata: Record<string, string> = {
      memoryId: memory.id,
      projectId: memory.projectId,
      deploymentId: memory.deploymentId,
      service: memory.service,
      confirmedBy: memory.confirmation.confirmedBy,
      confirmedAt: memory.confirmation.confirmedAt,
      confirmationMethod: memory.confirmation.confirmationMethod,
      failureType: memory.failureContext.failureType,
      outcome: memory.outcome,
      runtime: memory.environment.runtime,
      dbType: memory.environment.database.type,
      dbVersion: memory.environment.database.version,
      // Store full JSON payload for direct typed reconstruction on recall
      rawPayloadJson: JSON.stringify(memory),
    };

    // Step 8: Retry-safe execution loop
    const maxRetries = options.maxRetries ?? 3;
    let attempt = 0;
    let lastError: unknown;

    while (attempt < maxRetries) {
      attempt++;
      try {
        await this.adapter.retain(bankId, textContent, {
          document_id: documentId,
          timestamp: memory.createdAt,
          context: `Deployment ${memory.deploymentId} on service ${memory.service}`,
          metadata,
          tags,
        });

        return {
          success: true,
          bankId,
          documentId,
          memoryId: memory.id,
          confirmedBy: memory.confirmation.confirmedBy,
          confirmedAt: memory.confirmation.confirmedAt,
          attemptCount: attempt,
        };
      } catch (err) {
        lastError = err;
        if (attempt >= maxRetries) break;
        // Exponential backoff with jitter
        const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 3000);
        await new Promise(r => setTimeout(r, backoffMs));
      }
    }

    throw new Error(
      `Failed to retain verified experience after ${attempt} attempts: ${
        lastError instanceof Error ? lastError.message : String(lastError)
      }`
    );
  }
}
