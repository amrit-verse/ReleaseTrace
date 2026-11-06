#!/usr/bin/env node

/**
 * ReleaseTrace — Hindsight Live Retain/Recall Smoke Test Harness
 * 
 * Verifies live connection to Hindsight Cloud using @vectorize-io/hindsight-client.
 * If HINDSIGHT_API_KEY is configured: executes real API calls against Hindsight Cloud.
 * If credentials are not configured: reports exact missing environment variables
 * and verifies adapter in mock transport without faking a live integration.
 */

import { HindsightClient } from '@vectorize-io/hindsight-client';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.HINDSIGHT_API_KEY;
const BASE_URL = process.env.HINDSIGHT_API_URL || process.env.HINDSIGHT_BASE_URL || 'https://api.hindsight.vectorize.io';
const TEST_BANK_ID = `releasetrace-smoke-${Date.now()}`;

console.log('='.repeat(75));
console.log('  RELEASETRACE — HINDSIGHT CLOUD SMOKE TEST HARNESS');
console.log('='.repeat(75));
console.log(`Target Endpoint: ${BASE_URL}`);

async function runLiveSmokeTest() {
  console.log(`\n[1/5] Initializing official @vectorize-io/hindsight-client...`);
  const client = new HindsightClient({
    baseUrl: BASE_URL,
    apiKey: API_KEY,
    userAgent: 'releasetrace-smoke-test/1.0.0',
    maxAttempts: 3,
  });

  console.log(`[2/5] Testing getVersion() handshake...`);
  const startTime = Date.now();
  const version = await client.getVersion();
  const handshakeLatency = Date.now() - startTime;
  console.log(`  ✓ Version Handshake OK (${handshakeLatency}ms)`);
  console.log(`    API Version: ${version.api_version}`);
  console.log(`    Feature Flags: ${JSON.stringify(version.features || {})}`);

  console.log(`\n[3/5] Creating dedicated isolated test bank: ${TEST_BANK_ID}...`);
  const bankResult = await client.createBank(TEST_BANK_ID, {
    name: 'ReleaseTrace Live Smoke Test Bank',
    retainMission: 'Preserve verified deployment failures, missing Prisma migrations, and root causes.',
    reflectMission: 'Compare incoming release context against historical deployment failure precedents.',
  });
  console.log(`  ✓ Bank verified: ${bankResult.bank_id}`);

  console.log(`\n[4/5] Retaining verified incident memory case...`);
  const testPayload = JSON.stringify({
    title: 'Missing Prisma migration deploy step before Next.js build',
    failureSymptoms: ['P2021 Table does not exist in production database'],
    environment: { type: 'production', runtime: 'nodejs-22', framework: 'nextjs@15' },
    verifiedRootCause: 'prisma migrate deploy command was missing from CI release workflow',
    successfulResolution: 'Added npx prisma migrate deploy prior to next build in GitHub Actions',
    verifiedBy: 'DevOps Lead Engineer',
  });

  const retainStart = Date.now();
  const retainResult = await client.retain(TEST_BANK_ID, testPayload, {
    documentId: 'smoke-case-001',
    tags: ['smoke-test', 'prisma', 'migration'],
    context: 'Deployment incident verification',
  });
  const retainLatency = Date.now() - retainStart;
  console.log(`  ✓ Retain succeeded (${retainLatency}ms)`);
  console.log(`    Items count: ${retainResult.items_count}`);

  console.log(`\n[5/5] Testing semantic recall with natural language query...`);
  const recallStart = Date.now();
  const recallResult = await client.recall(TEST_BANK_ID, 'Next.js deployment failed due to missing database table migration');
  const recallLatency = Date.now() - recallStart;

  console.log(`  ✓ Recall succeeded (${recallLatency}ms)`);
  console.log(`    Recalled results count: ${recallResult.results.length}`);
  if (recallResult.results.length > 0) {
    const top = recallResult.results[0];
    console.log(`    Top Result ID: ${top.id}`);
    console.log(`    Text snippet: ${top.text.slice(0, 120)}...`);
  }

  // Cleanup
  try {
    console.log(`\nCleaning up temporary test bank: ${TEST_BANK_ID}...`);
    await client.deleteBank(TEST_BANK_ID);
    console.log(`  ✓ Temporary bank cleaned up.`);
  } catch (cleanErr: any) {
    console.warn(`  Note: Bank deletion skipped or not supported: ${cleanErr?.message || cleanErr}`);
  }

  console.log('\n' + '='.repeat(75));
  console.log('  LIVE HINDSIGHT CLOUD INTEGRATION VERIFIED 100% OPERATIONAL');
  console.log('='.repeat(75));
}

async function runMockDiagnosis() {
  console.log('\n[DIAGNOSTIC] HINDSIGHT_API_KEY environment variable is NOT set.');
  console.log('  To connect to real Hindsight Cloud:');
  console.log('  1. Sign up / login at https://hindsight.vectorize.io');
  console.log('  2. Generate an API Key in your dashboard');
  console.log('  3. Add the following to your .env file:');
  console.log('     HINDSIGHT_API_KEY="your-hindsight-api-key"');
  console.log('     HINDSIGHT_BASE_URL="https://api.hindsight.vectorize.io"');
  console.log('  4. Re-run: npm run smoke:hindsight\n');

  console.log('Verifying client module integrity in isolated mock transport...');
  const { HindsightAdapter } = await import('../src/intelligence/hindsight/adapter');
  const adapter = HindsightAdapter.getInstance({ useMockTransport: true });
  
  const health = await adapter.checkHealth();
  console.log(`  ✓ Adapter Health: isHealthy=${health.isHealthy}, mockTransport=${health.isMock}`);

  await adapter.createBank('smoke-mock-bank', { name: 'Mock Smoke Bank' });
  await adapter.retain('smoke-mock-bank', 'Test Prisma migration failure in production', {
    document_id: 'doc-1',
    tags: ['prisma', 'smoke'],
  });
  const recalled = await adapter.recall('smoke-mock-bank', 'Prisma migration failure');
  console.log(`  ✓ Mock Recall: returned ${recalled.results.length} result(s)`);
  console.log(`\nNotice: This dry-run verified application adapter logic.`);
  console.log(`Per engineering requirements: Live integration is NOT claimed until HINDSIGHT_API_KEY is provided.`);
}

async function main() {
  if (API_KEY && API_KEY.trim().length > 0) {
    try {
      await runLiveSmokeTest();
    } catch (err) {
      console.error('\n✖ Live Hindsight Cloud smoke test failed:', err);
      process.exit(1);
    }
  } else {
    await runMockDiagnosis();
  }
}

main();
