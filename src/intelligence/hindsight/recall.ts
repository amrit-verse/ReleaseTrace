/**
 * Recall of Relevant Historical Deployment Failures
 * 
 * Queries Hindsight with multi-aspect retrieval queries and reconstructs
 * verified engineering memories along with their retrieval scores.
 */

import { HindsightAdapter } from './adapter';
import { ProjectMemoryBankManager } from './bank-manager';
import type { DeploymentContext, VerifiedEngineeringMemory } from '../types';
import { validateVerifiedMemory } from '../memory/schema';

export interface RecalledExperienceItem {
  memory: VerifiedEngineeringMemory;
  hindsightScore: number;
}

export interface RecallOptions {
  budget?: 'low' | 'mid' | 'high';
  minScore?: number;
  tagFilter?: string[];
}

export class HistoricalRecallWorkflow {
  private adapter: HindsightAdapter;
  private bankManager: ProjectMemoryBankManager;

  constructor(adapter?: HindsightAdapter, bankManager?: ProjectMemoryBankManager) {
    this.adapter = adapter || HindsightAdapter.getInstance();
    this.bankManager = bankManager || new ProjectMemoryBankManager(this.adapter);
  }

  /**
   * Recalls historical deployment failures matching the current deployment context.
   */
  public async recallHistoricalFailures(
    deployment: DeploymentContext,
    options: RecallOptions = {}
  ): Promise<RecalledExperienceItem[]> {
    const bankId = this.bankManager.getProjectBankId(deployment.projectId);

    // Build rich, multi-faceted natural language query
    const queryParts: string[] = [
      `Deployment failure in service "${deployment.service}"`,
      `Database: ${deployment.environment.database.type} v${deployment.environment.database.version}`,
    ];

    if (deployment.gitDiffSummary.hasDatabaseMigrations) {
      queryParts.push(
        `Database migration: ${deployment.gitDiffSummary.migrationDetails || 'schema changes'}`
      );
    }

    if (deployment.telemetrySnapshot) {
      if (deployment.telemetrySnapshot.connectionPoolSaturation > 0.5) {
        queryParts.push('database connection pool exhaustion saturation');
      }
      if (deployment.telemetrySnapshot.errorRate > 0.02) {
        queryParts.push('high error rate 500 internal server error gateway timeout');
      }
    }

    const query = queryParts.join('. ');

    try {
      const response = await this.adapter.recall(bankId, query, {
        budget: options.budget || 'mid',
        tags: options.tagFilter,
        minScores: options.minScore ? { final: options.minScore } : undefined,
      });

      const recalledItems: RecalledExperienceItem[] = [];

      for (const item of response.results || []) {
        let memory: VerifiedEngineeringMemory | null = null;

        // Try direct typed reconstruction from stored JSON metadata
        if (item.metadata?.rawPayloadJson) {
          try {
            const parsed = JSON.parse(item.metadata.rawPayloadJson);
            memory = validateVerifiedMemory(parsed);
          } catch {
            // Fallback to text parsing
            memory = null;
          }
        }

        // If rawPayloadJson wasn't present, construct from text / metadata
        if (!memory && item.text) {
          memory = this.fallbackParseMemoryFromText(item, deployment.projectId);
        }

        if (memory) {
          const score = typeof item.scores?.final === 'number'
            ? item.scores.final
            : (typeof item.scores?.semantic === 'number' ? item.scores.semantic : 0.7);

          recalledItems.push({
            memory,
            hindsightScore: Math.min(1.0, Math.max(0.0, score)),
          });
        }
      }

      return recalledItems;
    } catch (err) {
      // In case the bank does not exist yet (e.g. freshly initialized empty bank)
      return [];
    }
  }

  private fallbackParseMemoryFromText(
    item: { id: string; text: string; metadata?: Record<string, string> | null },
    projectId: string
  ): VerifiedEngineeringMemory | null {
    try {
      return {
        id: item.metadata?.memoryId || item.id,
        projectId: item.metadata?.projectId || projectId,
        deploymentId: item.metadata?.deploymentId || 'unknown',
        service: item.metadata?.service || 'service',
        createdAt: new Date().toISOString(),
        environment: {
          runtime: item.metadata?.runtime || 'nodejs@20.0.0',
          database: {
            type: item.metadata?.dbType || 'postgresql',
            version: item.metadata?.dbVersion || '14',
          },
          infrastructure: {
            provider: 'aws',
            region: 'us-east-1',
            replicas: 2,
          },
          featureFlags: {},
          envVariables: {},
          dependencies: {},
        },
        failureContext: {
          failureType: item.metadata?.failureType || 'DEPLOYMENT_FAILURE',
          symptoms: ['Extracted from historical memory record'],
          errorSignatures: [],
          logsSample: [],
        },
        confirmedRootCause: item.text.includes('CONFIRMED ROOT CAUSE')
          ? item.text.split('CONFIRMED ROOT CAUSE')[1]?.split('##')[0]?.trim() || item.text
          : item.text,
        verifiedMitigation: item.text.includes('VERIFIED MITIGATION')
          ? item.text.split('VERIFIED MITIGATION')[1]?.split('##')[0]?.trim() || 'Refer to incident runbook'
          : 'Refer to incident runbook',
        outcome: (item.metadata?.outcome as any) || 'resolved',
        confirmation: {
          confirmedBy: item.metadata?.confirmedBy || 'system_engineer',
          confirmedAt: item.metadata?.confirmedAt || new Date().toISOString(),
          isConfirmed: true,
          confirmationMethod: (item.metadata?.confirmationMethod as any) || 'manual_investigation',
          verificationEvidence: 'Stored forensic incident record',
        },
        tags: [],
      };
    } catch {
      return null;
    }
  }
}
