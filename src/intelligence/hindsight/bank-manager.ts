/**
 * Stable Per-Project Memory Bank Configuration
 * 
 * Manages deterministic, stable memory bank IDs and initializes Hindsight banks
 * with specialized missions, extraction rules, and multi-arm retrieval settings.
 */

import { HindsightAdapter } from './adapter';

export const RELEASETRACE_RETAIN_MISSION = [
  'You are the engineering incident memory system for ReleaseTrace.',
  'Retain ONLY engineer-confirmed deployment failure experiences, confirmed root causes,',
  'and verified mitigations alongside their exact historical environmental conditions',
  '(database type, database version, pool size, replicas, runtime, feature flags).',
  'NEVER extract an unverified hypothesis or speculative guess as a verified root cause.',
  'Always extract the engineer attribution, confirmation date, and forensic evidence.',
].join(' ');

export const RELEASETRACE_REFLECT_MISSION = [
  'You are the release risk intelligence analyst for ReleaseTrace.',
  'When assessing release risk, recall only relevant verified historical deployment failures.',
  'Compare the target deployment environment with historical conditions.',
  'If environmental conditions differ, you must explain the mismatch.',
  'If recalled memories contradict each other, explicitly surface the conflict.',
  'Never treat past memories as current telemetry or present-day evidence.',
].join(' ');

export class ProjectMemoryBankManager {
  private adapter: HindsightAdapter;

  constructor(adapter?: HindsightAdapter) {
    this.adapter = adapter || HindsightAdapter.getInstance();
  }

  /**
   * Deterministic per-project memory bank identifier.
   * Uses authoritative RELEASETRACE_PROJECT_ID when projectId is omitted or empty.
   * e.g., "proj_releasetrace_core" -> "rt-proj_releasetrace_core"
   */
  public getProjectBankId(projectId?: string): string {
    const canonicalFallback = process.env.RELEASETRACE_PROJECT_ID || "proj_releasetrace_core";
    const raw = (projectId && projectId.trim().length > 0) ? projectId : canonicalFallback;
    const sanitized = raw
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `rt-${sanitized || canonicalFallback}`;
  }

  /**
   * Initializes or updates a stable project memory bank in Hindsight.
   */
  public async ensureProjectBank(projectId: string): Promise<string> {
    const bankId = this.getProjectBankId(projectId);

    await this.adapter.createBank(bankId, {
      name: `ReleaseTrace Bank: ${projectId}`,
      retainMission: RELEASETRACE_RETAIN_MISSION,
      reflectMission: RELEASETRACE_REFLECT_MISSION,
      retainExtractionMode: 'concise',
      enableObservations: true,
      enableTextSearch: true,         // BM25 keyword search arm
      enableTemporalRetrieval: true,  // Temporal query analysis
      enableGraphRetrieval: true,     // Entity graph traversal
      enableReranking: true,          // Cross-encoder reranking
    });

    return bankId;
  }

  /**
   * Reads back the bank's active configuration.
   */
  public async getBankConfiguration(projectId: string) {
    const bankId = this.getProjectBankId(projectId);
    return await this.adapter.getBankConfig(bankId);
  }
}
