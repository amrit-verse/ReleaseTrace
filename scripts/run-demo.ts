/**
 * ReleaseTrace Demo Runner
 * 
 * Executes the complete 8-stage sequence (A -> H) and outputs formatted results.
 */

import { runReleaseTraceDemoWorkflow } from '../src/intelligence/demo/demo-workflow';

async function main() {
  console.log('='.repeat(75));
  console.log('  RELEASETRACE INTELLIGENCE & PERSISTENT MEMORY DEMO (A -> H)');
  console.log('='.repeat(75));
  console.log('Demonstrating genuine evolutionary improvement through verified experience.\n');

  try {
    const result = await runReleaseTraceDemoWorkflow({ useMockTransport: true });

    for (const log of result.logs) {
      console.log(`\n▶ [${log.stage}]`);
      console.log(`  Summary: ${log.description}`);
      if (log.assessmentState) {
        console.log(`  Memory State: ${log.assessmentState}`);
      }
      if (log.overallRisk) {
        console.log(`  Overall Risk: ${log.overallRisk}`);
      }
      if (log.topRecommendation) {
        console.log(`  Top Action:   ${log.topRecommendation}`);
      }
      if (log.details && typeof log.details === 'object') {
        const lines = JSON.stringify(log.details, null, 2).split('\n');
        console.log(`  Details:`);
        for (const line of lines.slice(0, 8)) {
          console.log(`    ${line}`);
        }
        if (lines.length > 8) console.log(`    ...`);
      }
    }

    console.log('\n' + '='.repeat(75));
    console.log('  VISIBLY DIFFERENT RECOMMENDATION PROOF:');
    console.log('='.repeat(75));
    console.log(`State A (Empty Memory Bank):`);
    console.log(`- Recalled Memories: ${result.visiblyDifferentProof.memoryCitationsDifference.initialCount}`);
    console.log(`- Initial Recommendation: "${result.visiblyDifferentProof.recommendationDifference.initialA}"`);
    console.log(`\nState G (After Retaining Experience & Recalling Similar Deployment):`);
    console.log(`- Recalled Memories: ${result.visiblyDifferentProof.memoryCitationsDifference.subsequentCount}`);
    console.log(`- Transformed Recommendation: "${result.visiblyDifferentProof.recommendationDifference.subsequentG}"`);
    console.log(`- Historical Conditions Attached: "${result.visiblyDifferentProof.conditionsAccompanyingRecommendation}"`);
    console.log('\nAll 8 stages executed and verified successfully.\n');
  } catch (err) {
    console.error('Demo encountered error:', err);
    process.exit(1);
  }
}

main();
