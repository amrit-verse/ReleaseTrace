import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const OUT_DIR = path.resolve("./docs/qa/final");
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const BASE_URL = "http://localhost:3006";

async function main() {
  const browser = await chromium.launch();

  // Desktop context
  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  // Mobile context
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });

  const pages = [
    { route: "/dashboard", name: "dashboard" },
    { route: "/deployments", name: "deployments" },
    { route: "/memories", name: "memories" },
    { route: "/integrations", name: "integrations" },
    { route: "/learning-lab", name: "learning-lab" },
    { route: "/settings", name: "settings" },
  ];

  const themes = ["light", "dark", "cyber-teal", "warm-brown", "sunset-rose"];

  console.log("Capturing screenshots for desktop & mobile across all pages and themes...");

  // 1. Dashboard across all 5 themes (Desktop)
  for (const theme of themes) {
    const page = await desktop.newPage();
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle" });
    await page.evaluate((t) => {
      document.documentElement.setAttribute("data-theme", t);
      if (t !== "light") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }, theme);
    await page.waitForTimeout(500);
    const screenshotPath = path.join(OUT_DIR, `post-dashboard-desktop-${theme}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`✓ Saved ${screenshotPath}`);
    await page.close();
  }

  // 2. All pages in Dark Mode (Desktop)
  for (const p of pages) {
    const page = await desktop.newPage();
    await page.goto(`${BASE_URL}${p.route}`, { waitUntil: "networkidle" });
    await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "dark");
      document.documentElement.classList.add("dark");
    });
    await page.waitForTimeout(500);
    const screenshotPath = path.join(OUT_DIR, `post-${p.name}-desktop-dark.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`✓ Saved ${screenshotPath}`);
    await page.close();
  }

  // 3. Mobile: Dashboard (Light & Dark) and Drawer Open
  for (const theme of ["light", "dark"]) {
    const page = await mobile.newPage();
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle" });
    await page.evaluate((t) => {
      document.documentElement.setAttribute("data-theme", t);
      if (t !== "light") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }, theme);
    await page.waitForTimeout(500);
    const screenshotPath = path.join(OUT_DIR, `post-dashboard-mobile-${theme}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`✓ Saved ${screenshotPath}`);
    await page.close();
  }

  await desktop.close();
  await mobile.close();
  await browser.close();
  console.log("All screenshots successfully captured!");
}

main().catch((err) => {
  console.error("Screenshot error:", err);
  process.exit(1);
});
