/**
 * ReleaseTrace Intelligence Engine
 * 
 * Orchestrates the full lifecycle of persistent memory release risk analysis:
 * 1. Recall historical deployment failure experiences from Hindsight.
 * 2. Compare target environment against historical incident conditions.
 * 3. Detect and surface any memory contradictions.
 * 4. Apply relevance scoring and enforce empty-memory / weak-recall abstention.
 * 5. Run deterministic safety rules.
 * 6. Invoke Groq LLM with strictly bounded prompt and Zod output validation.
 * 7. Track provenance and memory references.
 */

import { HindsightAdapter } from '../hindsight/adapter';
import { ProjectMemoryBankManager } from '../hindsight/bank-manager';
import { ExperienceRetentionWorkflow } from '../hindsight/retention';
import { HistoricalRecallWorkflow } from '../hindsight/recall';
import { compareEnvironments } from '../memory/environment-comparator';
import { evaluateRecallRelevance } from '../memory/relevance';
import { detectMemoryContradictions } from '../memory/contradiction-detector';
import { evaluateDeterministicRules } from '../rules/risk-rules';
import { GroqAdapter } from '../llm/groq-adapter';
import { buildAssessmentPrompt } from '../llm/prompts';
import type {
  DeploymentContext,
  ReleaseAssessment,
  RecalledMemoryReference,
  Recommendation,
  RiskLevel,
} from '../types';

export interface IntelligenceEngineConfig {
  hindsightAdapter?: HindsightAdapter;
  groqAdapter?: GroqAdapter;
  relevanceThreshold?: number;
}

export class ReleaseTraceIntelligenceEngine {
  private hindsightAdapter: HindsightAdapter;
  private bankManager: ProjectMemoryBankManager;
  private retentionWorkflow: ExperienceRetentionWorkflow;
  private recallWorkflow: HistoricalRecallWorkflow;
  private groqAdapter: GroqAdapter;
  private relevanceThreshold: number;

  constructor(config: IntelligenceEngineConfig = {}) {
    this.hindsightAdapter = config.hindsightAdapter || HindsightAdapter.getInstance();
    this.bankManager = new ProjectMemoryBankManager(this.hindsightAdapter);
    this.retentionWorkflow = new ExperienceRetentionWorkflow(this.hindsightAdapter, this.bankManager);
    this.recallWorkflow = new HistoricalRecallWorkflow(this.hindsightAdapter, this.bankManager);
    this.groqAdapter = config.groqAdapter || new GroqAdapter();
    this.relevanceThreshold = config.relevanceThreshold ?? 0.65;
  }

  public getRetentionWorkflow(): ExperienceRetentionWorkflow {
    return this.retentionWorkflow;
  }

  public getRecallWorkflow(): HistoricalRecallWorkflow {
    return this.recallWorkflow;
  }

  public getBankManager(): ProjectMemoryBankManager {
    return this.bankManager;
  }

  public getHindsightAdapter(): HindsightAdapter {
    return this.hindsightAdapter;
  }

  public getGroqAdapter(): GroqAdapter {
    return this.groqAdapter;
  }

  /**
   * Assesses a candidate deployment using persistent memory and deterministic safeguards.
   */
  public async assessDeployment(deployment: DeploymentContext): Promise<ReleaseAssessment> {
    const bankId = this.bankManager.getProjectBankId(deployment.projectId);

    // 1. Recall historical deployment failure candidates from Hindsight
    const recalledCandidates = await this.recallWorkflow.recallHistoricalFailures(deployment);

    // 2. Perform Environment Comparison for each candidate
    const memoryComparisonPairs = recalledCandidates.map(candidate => ({
      memory: candidate.memory,
      hindsightScore: candidate.hindsightScore,
      environmentComparison: compareEnvironments(
        candidate.memory.environment,
        deployment.environment,
        { failureType: candidate.memory.failureContext.failureType }
      ),
      currentDeployment: deployment,
    }));

    // 3. Contradiction Detection across candidates
    const rawMemories = recalledCandidates.map(c => c.memory);
    const contradictions = detectMemoryContradictions(rawMemories);

    // 4. Evaluate Relevance & Enforce Abstention Gates
    const relevanceResult = evaluateRecallRelevance(memoryComparisonPairs, this.relevanceThreshold);
    const { state: memoryAssessmentState, shouldAbstain, abstentionReason, qualifiedMemories } = relevanceResult;

    // 5. Run Deterministic Release-Risk Rules
    const verifiedMemoriesForRules = shouldAbstain ? [] : qualifiedMemories.map(qm => qm.memory);
    const ruleEvaluation = evaluateDeterministicRules(deployment, verifiedMemoriesForRules);

    // 6. Primary Environment Comparison (using best qualified memory if available)
    const primaryEnvComparison = qualifiedMemories.length > 0
      ? compareEnvironments(qualifiedMemories[0].memory.environment, deployment.environment, {
          failureType: qualifiedMemories[0].memory.failureContext.failureType,
        })
      : (memoryComparisonPairs.length > 0 ? memoryComparisonPairs[0].environmentComparison : undefined);

    // 7. Synthesize Assessment with Groq LLM
    const prompt = buildAssessmentPrompt({
      deployment,
      ruleViolations: ruleEvaluation.violations,
      qualifiedMemories,
      environmentComparison: primaryEnvComparison,
      contradictions,
      shouldAbstain,
      abstentionReason,
    });

    // Calculate baseline risk: if deterministic rule flagged CRITICAL, it cannot be lowered by LLM
    const baselineRisk: RiskLevel = ruleEvaluation.calculatedRisk;

    const llmOutput = await this.groqAdapter.generateAssessment(prompt, {
      overallRisk: baselineRisk,
      shouldAbstain,
      abstentionReason,
      hasContradictions: contradictions.length > 0,
      memoriesUsed: qualifiedMemories,
    });

    // Enforce Deterministic Safety Gate: LLM cannot downgrade risk if a hard rule violated
    const finalRisk: RiskLevel = (baselineRisk === 'CRITICAL' || baselineRisk === 'HIGH')
      ? baselineRisk
      : llmOutput.overallRisk;

    // 8. Construct Recalled Memory References (Provenance)
    const recalledMemories: RecalledMemoryReference[] = shouldAbstain
      ? []
      : qualifiedMemories.map(qm => ({
          memoryId: qm.memory.id,
          confirmedRootCause: qm.memory.confirmedRootCause,
          verifiedMitigation: qm.memory.verifiedMitigation,
          historicalConditions: `${qm.memory.environment.runtime}, ${qm.memory.environment.database.type} v${qm.memory.environment.database.version}, pool: ${qm.memory.environment.database.poolSize ?? 'default'}`,
          relevanceScore: qm.finalRelevanceScore,
          environmentMatchScore: qm.environmentMatchScore,
          confirmedBy: qm.memory.confirmation.confirmedBy,
          confirmedAt: qm.memory.confirmation.confirmedAt,
        }));

    // 9. Process and Enrich Recommendations
    const finalRecommendations: Recommendation[] = llmOutput.recommendations.map(r => {
      // If recommendation came from verified memory, ensure it contains condition notice
      if (r.source === 'VERIFIED_MEMORY' && qualifiedMemories.length > 0) {
        const topMem = qualifiedMemories[0].memory;
        return {
          ...r,
          memoryReference: {
            memoryId: topMem.id,
            confirmedBy: topMem.confirmation.confirmedBy,
            confirmedAt: topMem.confirmation.confirmedAt,
          },
          conditionNotice: r.conditionNotice || `Observed under: ${topMem.environment.runtime}, ${topMem.environment.database.type} v${topMem.environment.database.version}`,
          divergenceWarning: primaryEnvComparison && !primaryEnvComparison.isMatch
            ? primaryEnvComparison.explanation
            : undefined,
        };
      }
      return r;
    });

    // If hard blocked by deterministic rules, prepend immediate halt recommendation
    if (ruleEvaluation.hardBlocked && !finalRecommendations.some(r => r.action.includes('Halt deployment'))) {
      finalRecommendations.unshift({
        action: `Halt deployment immediately: ${ruleEvaluation.hardBlockReason}`,
        priority: 'IMMEDIATE',
        rationale: 'Critical deterministic rule violations detected on production target.',
        source: 'DETERMINISTIC_RULE',
      });
    }

    return {
      deploymentId: deployment.deploymentId,
      projectId: deployment.projectId,
      assessedAt: new Date().toISOString(),
      overallRisk: finalRisk,
      confidence: shouldAbstain ? 'MEDIUM' : llmOutput.confidence,
      memoryAssessmentState,
      ruleViolations: ruleEvaluation.violations,
      currentEvidenceSummary: {
        gitChanges: `${deployment.gitDiffSummary.filesChanged.length} files changed (+${deployment.gitDiffSummary.additions}/-${deployment.gitDiffSummary.deletions}), Migrations: ${deployment.gitDiffSummary.hasDatabaseMigrations ? 'YES' : 'NO'}`,
        telemetryStatus: deployment.telemetrySnapshot
          ? `Error rate: ${(deployment.telemetrySnapshot.errorRate * 100).toFixed(1)}%, Pool Saturation: ${(deployment.telemetrySnapshot.connectionPoolSaturation * 100).toFixed(0)}%`
          : 'Healthy / No telemetry anomalies',
        criticalSignals: llmOutput.currentEvidenceObservations,
      },
      recalledMemories,
      environmentComparison: primaryEnvComparison,
      hasContradictions: contradictions.length > 0,
      contradictions,
      recommendations: finalRecommendations,
      abstentionReason,
      provenance: {
        llmModel: this.groqAdapter.getModel(),
        hindsightBankId: bankId,
        memoryEngineVersion: '1.0.0',
        memoryCountConsulted: recalledCandidates.length,
        timestamp: new Date().toISOString(),
      },
    };
  }
}
