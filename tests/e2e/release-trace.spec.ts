import { test, expect } from "@playwright/test";

test.describe("ReleaseTrace — Engineering Interface & Hindsight Memory E2E", () => {
  test("1. Dashboard overview renders KPIs, latest assessment, and failure categories", async ({ page }) => {
    await page.goto("/dashboard");

    // Check branding and system title
    await expect(page.locator("text=ReleaseTrace").first()).toBeVisible();
    await expect(page.locator("text=Release Operations Overview")).toBeVisible();

    // Check KPI Grid
    await expect(page.locator("text=ACTIVE RUNS")).toBeVisible();
    await expect(page.locator("text=INTERCEPTIONS")).toBeVisible();
    await expect(page.locator("text=RETAINED MEMORIES")).toBeVisible();
    await expect(page.locator("text=RULE ENFORCEMENT")).toBeVisible();

    // Check Critical Pre-Flight Interception Banner
    await expect(page.locator("text=CRITICAL PRE-FLIGHT INTERCEPTION: RELEASE BLOCKED")).toBeVisible();
    await expect(page.locator("text=auth-gateway").first()).toBeVisible();
    await expect(page.locator("text=Inspect Assessment").first()).toBeVisible();

    // Check Recurring Failure Categories
    await expect(page.locator("text=Recurring Failure Categories")).toBeVisible();
    await expect(page.locator("text=Unindexed Large DB Migrations")).toBeVisible();
    await expect(page.locator("text=Redis Connection Storms under HPA Scaling")).toBeVisible();
  });

  test("2. Deployments history filtering and search", async ({ page }) => {
    await page.goto("/deployments");

    // Title and table header
    await expect(page.locator("text=Deployment Register")).toBeVisible();

    // Search filter
    const searchInput = page.locator("input[placeholder*='Search service']");
    await expect(searchInput).toBeVisible();
    await searchInput.fill("auth-gateway");
    await expect(page.locator("td:has-text('auth-gateway')").first()).toBeVisible();

    // Reset filter
    await page.click("button:has-text('Reset Filters')");
    await expect(page.locator("td:has-text('order-service')").first()).toBeVisible();

    // Inspect link navigation
    await page.locator("a:has-text('Inspect')").first().click();
    await expect(page).toHaveURL(/\/deployments\/dep-/);
  });

  test("3. Deployment Detail deep-dive with risk tabs and verification gates", async ({ page }) => {
    await page.goto("/deployments/dep-prod-9402");

    // Header metadata
    await expect(page.locator("text=auth-gateway").first()).toBeVisible();
    await expect(page.locator("text=92").first()).toBeVisible();

    // Tab 1: Overview
    await expect(page.locator("text=Reasons Behind Assessment & Gating Decision")).toBeVisible();

    // Tab 2: Telemetry Evidence
    await page.click("button:has-text('Telemetry Evidence')");
    await expect(page.locator("text=Table rewrite lock detected on table with 49.8M rows")).toBeVisible();

    // Tab 3: Environment Parity
    await page.click("button:has-text('Environment Parity')");
    await expect(page.locator("text=Database Table Row Count Drift")).toBeVisible();

    // Tab 4: Hindsight Recall
    await page.click("button:has-text('Hindsight Recall')");
    await expect(page.locator("text=MEM-2024-884").first()).toBeVisible();

    // Tab 5: Verification Gates & Interactive Checklist
    await page.click("button:has-text('Verification Gates')");
    await expect(page.locator("text=Engineer Pre-Rollout Verification Gates")).toBeVisible();

    // Toggle verification state on first gate if present
    const verifyBtn = page.locator("button:has-text('VERIFY')").first();
    if (await verifyBtn.isVisible()) {
      await verifyBtn.click();
      await expect(page.locator("button:has-text('VERIFIED')").first()).toBeVisible();
    }
  });

  test("4. Memory Explorer shows historical experience, failed approaches, and provenance", async ({ page }) => {
    await page.goto("/memories");

    await expect(page.locator("text=Hindsight Memory Explorer")).toBeVisible();
    await expect(page.locator("text=MEM-2024-884").first()).toBeVisible();
    await expect(page.locator("text=Postgres Table Rewrite Outage during User Schema Migration")).toBeVisible();
    await expect(page.locator("text=Exclusive AccessExclusiveLock held on `users` table for > 180s")).toBeVisible();
    await expect(page.locator("text=Connection pool exhausted (500/500 connections in pool)")).toBeVisible();

    // Check failed approaches callout
    await expect(page.locator("text=Failed Approaches During Incident (DO NOT REPEAT)").first()).toBeVisible();
    await expect(page.locator("text=Tried increasing statement_timeout to 600s").first()).toBeVisible();

    // Check Provenance
    await expect(page.locator("text=sarah.chen@engineering.internal").first()).toBeVisible();
    await expect(page.locator("text=47 minutes").first()).toBeVisible();

    // Test Search in Memory Explorer
    const search = page.locator("input[placeholder*='Search symptoms']");
    await search.fill("Redis");
    await expect(page.locator("text=MEM-2024-712").first()).toBeVisible();

    // Open Retain Modal
    await page.click("button:has-text('Retain New Incident')");
    await expect(page.locator("text=Retain Incident into Hindsight Memory Engine")).toBeVisible();
    await page.click("button:has-text('CANCEL')");
  });

  test("5. Learning Laboratory Before & After Experience (Cold -> Retention -> Warm in Benchmarks mode)", async ({ page }) => {
    await page.goto("/learning-lab");

    await expect(page.locator("text=Interactive Learning Lab")).toBeVisible();

    // Switch to Benchmarks mode for deterministic fixture walkthrough
    await page.click("button:has-text('Benchmarks')");

    // Phase 1: Cold Run
    await page.click("button:has-text('Run Cold Assessment')");
    await expect(page.locator("text=COLD ASSESSMENT OUTCOME:")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=CATASTROPHIC OUTAGE EXPERIENCED IN PRODUCTION")).toBeVisible();

    // Phase 2: Retention
    await expect(page.locator("button:has-text('Retain Incident Memory to Hindsight')")).toBeVisible();
    await page.click("button:has-text('Retain Incident Memory to Hindsight')");

    // Phase 3: Warm Run
    await expect(page.locator("text=Memory Verified: Successfully Indexed in Hindsight Cluster")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("button:has-text('Run Warm Assessment')")).toBeVisible();
    await page.click("button:has-text('Run Warm Assessment')");

    // Assert Warm Outcome Interception
    await expect(page.locator("text=OUTAGE INTERCEPTED: RELEASE AUTOMATICALLY BLOCKED")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Averted Blast Radius")).toBeVisible();
    await expect(page.locator("text=Enforced Pre-Flight Action Matrix:")).toBeVisible();
  });

  test("6. Integrations screen displays connections and supports probe ping", async ({ page }) => {
    await page.goto("/integrations");

    await expect(page.locator("text=Engineering Integrations")).toBeVisible();
    await expect(page.locator("text=Vectorize Hindsight Memory Engine")).toBeVisible();
    await expect(page.locator("text=GitHub Actions CI/CD")).toBeVisible();
    await expect(page.locator("text=ArgoCD GitOps Engine")).toBeVisible();
    await expect(page.locator("text=Production Kubernetes Clusters")).toBeVisible();

    // Test ping
    const testPingBtn = page.locator("button:has-text('TEST PING')").first();
    await testPingBtn.click();
    await expect(page.locator("text=Health Probe Passed").first()).toBeVisible({ timeout: 5000 });
  });

  test("7. Settings page allows policy thresholds and configuration export", async ({ page }) => {
    await page.goto("/settings");

    await expect(page.locator("text=Workspace & Policy Configuration")).toBeVisible();
    await expect(page.locator("text=Automated Release Gating Rules")).toBeVisible();
    await expect(page.locator("text=Risk Tolerance Threshold Index:")).toBeVisible();

    // Save settings
    await page.click("button:has-text('SAVE WORKSPACE SETTINGS')");
    await expect(page.locator("text=Workspace policy configuration updated").first()).toBeVisible();
  });

  test("8. Responsive Layout: mobile navigation drawer operates smoothly", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/dashboard");

    // Mobile hamburger menu
    const menuBtn = page.locator("button[aria-label='Toggle navigation menu']");
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();

    // Scoped mobile drawer navigation
    await expect(page.locator("div.fixed.inset-0 span:has-text('ReleaseTrace')").first()).toBeVisible();
    await page.locator("div.fixed.inset-0 a[href='/learning-lab']").click();
    await expect(page).toHaveURL("/learning-lab");
  });

  test("9. Canonical Project Bank Consistency: Learning Lab retains incident into project bank and recalls from same bank", async ({ page }) => {
    await page.goto("/learning-lab");

    // Ensure Live Engine mode is active
    await page.click("button:has-text('Live Engine')");

    // Reset lab to clean state
    await page.click("button:has-text('Reset')");

    // Phase 1: Cold Run
    await page.click("button:has-text('Run Cold Assessment')");
    await expect(page.locator("text=COLD ASSESSMENT OUTCOME:")).toBeVisible({ timeout: 10000 });

    // Phase 2: Retention into canonical project bank
    await expect(page.locator("button:has-text('Retain Incident Memory to Hindsight')")).toBeVisible();
    await page.click("button:has-text('Retain Incident Memory to Hindsight')");
    await expect(page.locator("text=Memory Verified: Successfully Indexed in Hindsight Cluster")).toBeVisible({ timeout: 10000 });

    // Phase 3: Warm Run on same project bank
    await expect(page.locator("button:has-text('Run Warm Assessment')")).toBeVisible();
    await page.click("button:has-text('Run Warm Assessment')");

    // Prove that warm assessment completes with outage interception
    await expect(page.locator("text=OUTAGE INTERCEPTED: RELEASE AUTOMATICALLY BLOCKED")).toBeVisible({ timeout: 10000 });
  });
});
