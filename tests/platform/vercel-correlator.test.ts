import { describe, it, expect, vi } from "vitest";
import { correlateVercelDeployment } from "../../src/lib/vercel/index";

describe("Vercel Deployment Correlator", () => {
  it("returns unconfigured message when VERCEL_API_TOKEN is missing", async () => {
    const result = await correlateVercelDeployment("abc1234", { apiToken: "" });
    expect(result.found).toBe(false);
    expect(result.error).toContain("VERCEL_API_TOKEN not configured");
  });

  it("successfully correlates deployment by commit SHA from Vercel API response", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        deployments: [
          {
            uid: "dpl_abc999",
            url: "releasetrace-git-feat-test.vercel.app",
            name: "releasetrace",
            state: "READY",
            created: 1730000000000,
            ready: 1730000045000,
            meta: {
              githubCommitSha: "c0ffee1234567890abcdef",
              githubCommitRef: "feat/billing",
            },
          },
        ],
      }),
    });

    const result = await correlateVercelDeployment("c0ffee1234567890abcdef", {
      apiToken: "mock-vercel-token",
      projectId: "prj_01",
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    expect(result.found).toBe(true);
    expect(result.isProcessing).toBe(false);
    expect(result.deployment?.id).toBe("dpl_abc999");
    expect(result.deployment?.url).toBe("https://releasetrace-git-feat-test.vercel.app");
    expect(result.deployment?.state).toBe("READY");
  });

  it("handles deployments that are still building / initializing", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        deployments: [
          {
            uid: "dpl_building_01",
            url: "releasetrace-in-progress.vercel.app",
            name: "releasetrace",
            state: "BUILDING",
            created: Date.now(),
            meta: {
              githubCommitSha: "deadbeef9999",
            },
          },
        ],
      }),
    });

    const result = await correlateVercelDeployment("deadbeef9999", {
      apiToken: "mock-token",
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    expect(result.found).toBe(true);
    expect(result.isProcessing).toBe(true);
    expect(result.deployment?.state).toBe("BUILDING");
  });

  it("returns found=false when commit SHA does not match any deployment", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        deployments: [
          {
            uid: "dpl_other",
            state: "READY",
            meta: { githubCommitSha: "111111111111" },
          },
        ],
      }),
    });

    const result = await correlateVercelDeployment("999999999999", {
      apiToken: "mock-token",
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    expect(result.found).toBe(false);
  });
});
