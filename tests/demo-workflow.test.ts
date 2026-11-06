import { describe, it, expect } from 'vitest';
import { runReleaseTraceDemoWorkflow } from '../src/intelligence/demo/demo-workflow';

describe('Reproducible Demo Workflow Sequence (States A -> H)', () => {
  it('executes full evolutionary sequence A through H and proves visibly different recommendation', async () => {
    const result = await runReleaseTraceDemoWorkflow({ useMockTransport: true });

    // Assert all 8 stages are logged
    expect(result.logs.length).toBe(8);
    const stages = result.logs.map(l => l.stage);
    expect(stages).toContain('A. Empty memory bank');
    expect(stages).toContain('B. First deployment failure');
    expect(stages).toContain('C. Engineer confirms root cause');
    expect(stages).toContain('D. Retain verified memory in Hindsight');
    expect(stages).toContain('E. Similar subsequent deployment');
    expect(stages).toContain('F. Recall previous experience');
    expect(stages).toContain('G. Generate visibly different recommendation');
    expect(stages).toContain('H. Verify recommendation against current evidence');

    // State A: Empty memory bank
    expect(result.assessmentA.memoryAssessmentState).toBe('ABSTAINED_NO_RELEVANT_MEMORIES');
    expect(result.assessmentA.recalledMemories.length).toBe(0);
    expect(result.assessmentA.abstentionReason).toContain('Empty memory bank');

    // State C & D: Confirmed memory retained
    expect(result.verifiedMemoryRetained.confirmation.isConfirmed).toBe(true);
    expect(result.verifiedMemoryRetained.confirmation.confirmedBy).toBe('sarah.chen@engineering.corp');

    // State F & G: Recalled & Visibly Different Recommendation
    expect(result.assessmentG.memoryAssessmentState).toBe('ACCUMULATED_EXPERIENCE');
    expect(result.assessmentG.recalledMemories.length).toBe(1);
    expect(result.assessmentG.recalledMemories[0].memoryId).toBe('case-pay-pool-001');

    // Prove visibly different recommendations between A and G
    const actionA = result.visiblyDifferentProof.recommendationDifference.initialA;
    const actionG = result.visiblyDifferentProof.recommendationDifference.subsequentG;
    expect(actionA).not.toBe(actionG);
    expect(actionG).toContain('Apply confirmed historical mitigation');
    expect(actionG).toContain('SET lock_timeout');

    // State H: Historical conditions accompanied & Current evidence distinguished
    expect(result.visiblyDifferentProof.conditionsAccompanyingRecommendation).toContain('postgresql');
    expect(result.assessmentG.currentEvidenceSummary.gitChanges).toBeDefined();
    expect(result.assessmentG.currentEvidenceSummary.gitChanges).not.toBe(
      result.assessmentG.recalledMemories[0].historicalConditions
    );
  });
});
