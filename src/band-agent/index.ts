/**
 * ReleaseTrace AI - Band Agent Entry Point
 *
 * Dedicated persistent worker for Band collaborative platform.
 * Run with: npm run band:agent
 */

import dotenv from "dotenv";
import path from "path";

// Load environment files: .env.local takes precedence, then .env
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { runWorker } from "./worker";

export * from "./types";
export * from "./config";
export * from "./mention";
export * from "./personality";
export * from "./reasoning";
export * from "./adapter";
export * from "./worker";

// If executed directly from CLI
if (require.main === module || process.argv[1]?.endsWith("band-agent/index.ts")) {
  runWorker().catch((err) => {
    console.error("Fatal worker startup error:", err);
    process.exit(1);
  });
}
