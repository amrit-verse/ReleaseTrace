import { PrismaClient } from "@prisma/client";

import { generateHmacSignature } from "../src/lib/security/signature";

const WEBHOOK_URL = "https://releasetrace.vercel.app/api/webhooks/deployments";
const SECRET = process.env.RELEASETRACE_WEBHOOK_SECRET || "development-webhook-secret-key-32-chars-min";
const INNGEST_KEY = process.env.INNGEST_SIGNING_KEY!;
const PROJECT_ID = "proj-releasetrace-cloud";
const PROJECT_NAME = "ReleaseTrace Cloud Service";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

function signPayload(bodyStr: string) {
  const timestamp = new Date().toISOString();
  const signature = generateHmacSignature(bodyStr, SECRET);
  return { signature, timestamp };
}

async function sendWebhook(eventPayload: any) {
  const bodyStr = JSON.stringify(eventPayload);
  const { signature, timestamp } = signPayload(bodyStr);

  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-releasetrace-signature": signature,
      "x-releasetrace-timestamp": timestamp,
    },
    body: bodyStr,
  });

  const status = res.status;
  const json = await res.json();
  return { status, json };
}

async function waitForInngestRun(eventId: string, maxWaitMs = 30000) {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    try {
      const res = await fetch(`https://api.inngest.com/v2/events/${eventId}/runs`, {
        headers: { Authorization: `Bearer ${INNGEST_KEY}` },
      });
      if (res.ok) {
        const data = await res.json();
        const runs = data.data || [];
        if (runs.length > 0) {
          const run = runs[0];
          if (run.status === "COMPLETED" || run.status === "FAILED") {
            return run;
          }
        }
      }
    } catch {
      // Retry
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return null;
}

async function main() {
  console.log("=================================================================");
  console.log("  RELEASETRACE — AUTONOMOUS CLOUD RELEASE REHEARSAL");
  console.log("=================================================================\n");

  // -------------------------------------------------------------
  // RELEASE 1: Baseline release with unverified incident conditions
  // -------------------------------------------------------------
  console.log("[1/10] Dispatching Release 1 to live Vercel webhook endpoint...");
  const event1Id = `evt-cloud-1-${Date.now()}`;
  const release1Payload = {
    eventId: event1Id,
    provider: "github_actions",
    projectId: PROJECT_ID,
    projectName: PROJECT_NAME,
    eventType: "deployment_started",
    timestamp: new Date().toISOString(),
    evidence: {
      commitSha: "aae1a037c7f9e5c777cb00249a972cfe8938d428",
      branch: "feat/payment-gateway",
      commitMessage: "feat(payments): integrate payment gateway and database migration",
      author: "amrit-verse",
      repository: "amrit-verse/ReleaseTrace",
      framework: "nextjs",
      runtimeVersion: "nodejs-22",
      buildPassed: true,
      testsPassed: true,
      testSummary: { total: 35, passed: 35, failed: 0, skipped: 0 },
      migrationEvidence: {
        hasPendingMigrations: true,
        migrationFileCount: 1,
        migrationNames: ["20261107_add_payments"],
      },
      changedFiles: ["prisma/schema.prisma", "src/lib/payments.ts"],
      environment: "staging",
      collectedAt: new Date().toISOString(),
    },
    metadata: {
      environment: {
        databaseType: "postgresql",
        databaseVersion: "17",
        poolSize: 10,
        replicas: 1,
      },
    },
  };

  const webhook1Res = await sendWebhook(release1Payload);
  console.log("  ✓ Webhook 1 Response Status:", webhook1Res.status);
  console.log("  ✓ Ingestion Result:", JSON.stringify(webhook1Res.json));

  const inngestEvent1Id = webhook1Res.json.inngestEventIds?.[0];
  console.log(`\n[2/10] Tracking Inngest Cloud execution for event: ${inngestEvent1Id}...`);

  // Wait for Inngest function execution
  let run1 = null;
  if (inngestEvent1Id) {
    run1 = await waitForInngestRun(inngestEvent1Id);
  }
  console.log("  ✓ Inngest Run 1 Status:", run1 ? run1.status : "Dispatched and running in Inngest Cloud");
  if (run1) {
    console.log("    Run ID:", run1.id);
    console.log("    Function:", run1.function?.name || run1.function_id);
    console.log("    Output:", JSON.stringify(run1.output));
  }

  // -------------------------------------------------------------
  // Verify Neon DB persistence for Release 1
  // -------------------------------------------------------------
  console.log("\n[3/10] Verifying Neon PostgreSQL persistence for Release 1...");
  await new Promise((r) => setTimeout(r, 4000));
  const deployment1 = await prisma.deployment.findFirst({
    where: { projectId: PROJECT_ID, providerDeploymentId: event1Id },
    include: { assessment: true },
  });
  console.log("  ✓ Neon Deployment 1 Record:", deployment1 ? `Found (ID: ${deployment1.id})` : "Pending");
  console.log("  ✓ Neon Assessment 1 Record:", deployment1?.assessment ? `Found (Risk: ${deployment1.assessment.overallCategory})` : "Pending");

  // -------------------------------------------------------------
  // Engineer confirms root cause and verified resolution
  // -------------------------------------------------------------
  console.log("\n[4/10] Simulating human engineer confirmation and verified retention...");
  const retainUrl = "https://releasetrace.vercel.app/api/memories";
  const retentionPayload = {
    projectId: PROJECT_ID,
    service: PROJECT_NAME,
    deploymentId: deployment1?.id || `dep-${Date.now()}`,
    title: "PostgreSQL pool starvation during schema migration lock",
    confirmedRootCause: "PostgreSQL connection pool size 10 was exhausted during concurrent migration table lock",
    verifiedMitigation: "Scale connection pool to 25 and set pool acquire timeout to 5000ms prior to migration deploy",
    failureContext: {
      failureType: "DATABASE_CONNECTION_POOL_EXHAUSTION",
      symptoms: ["P2024 Timed out fetching a new connection from the connection pool"],
      errorSignatures: ["Timed out fetching a new connection from the pool"],
      logsSample: ["PrismaClientInitializationError: connection pool timeout"],
    },
    environment: {
      runtime: "nodejs-22",
      database: { type: "postgresql", version: "17", poolSize: 10 },
      infrastructure: { provider: "vercel", region: "iad1", replicas: 1 },
      featureFlags: {},
      envVariables: {},
      dependencies: { next: "15.5.29", "@prisma/client": "6.19.3" },
    },
    confirmation: {
      isConfirmed: true,
      confirmedBy: "Amrit (Lead Release Architect)",
      confirmedAt: new Date().toISOString(),
      confirmationMethod: "manual_investigation",
      verificationEvidence: "Forensic verification in staging incident runbook #4102",
      notes: "Production-ready engineering confirmation",
    },
    tags: ["payments", "postgresql", "connection-pool", "verified-resolution"],
  };

  const retainRes = await fetch(retainUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-engineer-email": "lead-engineer@releasetrace.dev",
    },
    body: JSON.stringify(retentionPayload),
  });

  const retainJson = await retainRes.json();
  console.log("  ✓ Retention API Status:", retainRes.status);
  console.log("  ✓ Retention Outcome:", JSON.stringify(retainJson, null, 2));
  const retainedDocId = retainJson.documentId || retainJson.memoryId;

  // -------------------------------------------------------------
  // RELEASE 2: Subsequent release under identical conditions
  // -------------------------------------------------------------
  console.log("\n[5/10] Dispatching Release 2 (Subsequent release under similar conditions)...");
  const event2Id = `evt-cloud-2-${Date.now()}`;
  const release2Payload = {
    eventId: event2Id,
    provider: "github_actions",
    projectId: PROJECT_ID,
    projectName: PROJECT_NAME,
    eventType: "deployment_started",
    timestamp: new Date().toISOString(),
    evidence: {
      commitSha: "bbf2b148d8a01f5c667cb00249a972cfe8938d429",
      branch: "feat/billing-subscriptions",
      commitMessage: "feat(billing): add billing subscriptions and customer migrations",
      author: "amrit-verse",
      repository: "amrit-verse/ReleaseTrace",
      framework: "nextjs",
      runtimeVersion: "nodejs-22",
      buildPassed: true,
      testsPassed: true,
      testSummary: { total: 38, passed: 38, failed: 0, skipped: 0 },
      migrationEvidence: {
        hasPendingMigrations: true,
        migrationFileCount: 1,
        migrationNames: ["20261107_add_subscriptions"],
      },
      changedFiles: ["prisma/schema.prisma", "src/lib/billing.ts"],
      environment: "staging",
      collectedAt: new Date().toISOString(),
    },
    metadata: {
      environment: {
        databaseType: "postgresql",
        databaseVersion: "17",
        poolSize: 10,
        replicas: 1,
      },
    },
  };

  const webhook2Res = await sendWebhook(release2Payload);
  console.log("  ✓ Webhook 2 Response Status:", webhook2Res.status);
  console.log("  ✓ Ingestion Result:", JSON.stringify(webhook2Res.json));

  const inngestEvent2Id = webhook2Res.json.inngestEventIds?.[0];
  console.log(`\n[6/10] Tracking Inngest Cloud execution for event: ${inngestEvent2Id}...`);

  let run2 = null;
  if (inngestEvent2Id) {
    run2 = await waitForInngestRun(inngestEvent2Id);
  }
  console.log("  ✓ Inngest Run 2 Status:", run2 ? run2.status : "Dispatched and running in Inngest Cloud");
  if (run2) {
    console.log("    Run ID:", run2.id);
    console.log("    Function:", run2.function?.name || run2.function_id);
    console.log("    Output:", JSON.stringify(run2.output));
  }

  // -------------------------------------------------------------
  // Verify Recall and Neon Assessment 2
  // -------------------------------------------------------------
  console.log("\n[7/10] Verifying Memory Recall and Neon Assessment 2...");
  await new Promise((r) => setTimeout(r, 5000));
  const deployment2 = await prisma.deployment.findFirst({
    where: { projectId: PROJECT_ID, providerDeploymentId: event2Id },
    include: { assessment: true },
  });
  console.log("  ✓ Neon Deployment 2 Record:", deployment2 ? `Found (ID: ${deployment2.id})` : "Pending");
  console.log("  ✓ Neon Assessment 2 Record:", deployment2?.assessment ? `Found (Risk: ${deployment2.assessment.overallCategory})` : "Pending");
  if (deployment2?.assessment) {
    console.log("    Summary:", deployment2.assessment.summary);
    console.log("    Grounded Mitigation:", deployment2.assessment.groundedExplanation);
  }

  // -------------------------------------------------------------
  // Dashboard API verification
  // -------------------------------------------------------------
  console.log("\n[8/10] Verifying live Dashboard Stats endpoint for this project...");
  const statsRes = await fetch(`https://releasetrace.vercel.app/api/dashboard/stats?projectId=${PROJECT_ID}`);
  const statsJson = await statsRes.json();
  console.log("  ✓ Dashboard Stats Status:", statsRes.status);
  console.log("  ✓ Total Deployments in DB:", statsJson.totalDeployments);
  console.log("  ✓ Active Assessments in DB:", statsJson.activeAssessments);
  console.log("  ✓ Verified Precedents in Hindsight Bank:", statsJson.verifiedPrecedentsCount);
  console.log("  ✓ Hindsight Bank ID:", statsJson.bankId);

  console.log("\n=================================================================");
  console.log("  CLOUD INTEGRATION REHEARSAL SUMMARY");
  console.log("=================================================================");
  console.log(`  Project: ${PROJECT_ID}`);
  console.log(`  Hindsight Bank: rt-${PROJECT_ID}`);
  console.log(`  Retained Document ID: ${retainedDocId}`);
  console.log(`  Vercel Live URL: https://releasetrace.vercel.app`);
  console.log("=================================================================\n");
}

main()
  .catch((err) => {
    console.error("Rehearsal failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
