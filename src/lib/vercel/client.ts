import { DeploymentStatus, EnvironmentType } from "@/contracts";

export interface VercelClientOptions {
  token?: string;
  teamId?: string;
  baseUrl?: string;
  fetchFn?: typeof fetch;
}

export interface VercelDeploymentResponse {
  uid: string;
  name: string;
  url: string;
  created: number;
  readyState: "INITIALIZING" | "QUEUED" | "BUILDING" | "READY" | "ERROR" | "CANCELED";
  target?: "production" | "preview" | "staging" | string | null;
  meta?: {
    githubCommitSha?: string;
    githubCommitRef?: string;
    githubCommitMessage?: string;
    githubCommitAuthorName?: string;
    githubRepo?: string;
    [key: string]: string | undefined;
  };
  inspectorUrl?: string;
}

export interface CorrelatedDeployment {
  found: boolean;
  isPending: boolean;
  vercelDeploymentId?: string;
  url?: string;
  status: DeploymentStatus;
  rawState?: string;
  environment: EnvironmentType;
  commitSha: string;
  branch: string;
  createdAt?: string;
  readyAt?: string;
  metadata?: Record<string, unknown>;
}

export class VercelApiError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    // Sanitize message to guarantee no tokens or sensitive headers leak
    super(message.replace(/Bearer\s+[a-zA-Z0-9_-]+/gi, "Bearer [REDACTED]"));
    this.name = "VercelApiError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Normalized mapping from Vercel readyState to ReleaseTrace DeploymentStatus.
 */
export function mapVercelStateToStatus(state: string): DeploymentStatus {
  switch (state?.toUpperCase()) {
    case "READY":
      return "DEPLOYED";
    case "BUILDING":
      return "BUILDING";
    case "INITIALIZING":
    case "QUEUED":
      return "QUEUED";
    case "ERROR":
      return "FAILED";
    case "CANCELED":
      return "CANCELED";
    default:
      return "QUEUED";
  }
}

export function mapVercelTargetToEnvironment(target?: string | null): EnvironmentType {
  switch (target?.toLowerCase()) {
    case "production":
      return "production";
    case "staging":
      return "staging";
    case "preview":
      return "preview";
    default:
      return "preview";
  }
}

export class VercelClient {
  private readonly token: string | undefined;
  private readonly teamId: string | undefined;
  private readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;

  constructor(options: VercelClientOptions = {}) {
    this.token = options.token || process.env.VERCEL_TOKEN;
    this.teamId = options.teamId || process.env.VERCEL_TEAM_ID;
    this.baseUrl = (options.baseUrl || "https://api.vercel.com").replace(/\/$/, "");
    this.fetchFn = options.fetchFn || fetch;
  }

  public hasCredentials(): boolean {
    return Boolean(this.token && this.token.trim().length > 0);
  }

  private getHeaders(): Record<string, string> {
    if (!this.token) {
      throw new VercelApiError(
        "Missing Vercel API token. Set VERCEL_TOKEN in your environment or pass it to VercelClient.",
        401,
        "UNAUTHENTICATED"
      );
    }
    return {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
      "User-Agent": "ReleaseTrace-Platform/1.0",
    };
  }

  /**
   * Fetches a deployment by its Vercel Deployment ID (e.g. dpl_...).
   */
  public async getDeployment(deploymentId: string): Promise<VercelDeploymentResponse> {
    if (!deploymentId) {
      throw new VercelApiError("deploymentId is required", 400, "BAD_REQUEST");
    }

    let url = `${this.baseUrl}/v13/deployments/${encodeURIComponent(deploymentId)}`;
    if (this.teamId) {
      url += `?teamId=${encodeURIComponent(this.teamId)}`;
    }

    const response = await this.fetchFn(url, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new VercelApiError(
        `Vercel API request failed (${response.status}): ${errorText.slice(0, 200)}`,
        response.status
      );
    }

    return (await response.json()) as VercelDeploymentResponse;
  }

  /**
   * Queries Vercel deployments associated with a specific Git commit SHA.
   */
  public async listDeploymentsByCommit(
    commitSha: string,
    options: { projectId?: string; limit?: number } = {}
  ): Promise<VercelDeploymentResponse[]> {
    if (!commitSha) {
      throw new VercelApiError("commitSha is required", 400, "BAD_REQUEST");
    }

    const params = new URLSearchParams();
    if (options.projectId) {
      params.set("projectId", options.projectId);
    }
    if (this.teamId) {
      params.set("teamId", this.teamId);
    }
    params.set("meta-githubCommitSha", commitSha);
    params.set("limit", String(options.limit ?? 10));

    const url = `${this.baseUrl}/v6/deployments?${params.toString()}`;

    const response = await this.fetchFn(url, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new VercelApiError(
        `Failed to query Vercel deployments by commit (${response.status}): ${errorText.slice(0, 200)}`,
        response.status
      );
    }

    const data = (await response.json()) as { deployments: VercelDeploymentResponse[] };
    return data.deployments || [];
  }

  /**
   * Correlates an internal release event with a Vercel deployment record using the commit SHA.
   * Handles still-pending deployment states (INITIALIZING, QUEUED, BUILDING).
   */
  public async correlateDeployment(
    commitSha: string,
    options: { projectId?: string } = {}
  ): Promise<CorrelatedDeployment> {
    const deployments = await this.listDeploymentsByCommit(commitSha, options);

    if (!deployments || deployments.length === 0) {
      return {
        found: false,
        isPending: true,
        status: "QUEUED",
        commitSha,
        branch: "unknown",
        environment: "preview",
        metadata: { reason: "No Vercel deployment matching commit SHA found yet." },
      };
    }

    // Sort to get the most recent deployment for this commit
    const latest = deployments.sort((a, b) => b.created - a.created)[0];

    const isPending =
      latest.readyState === "INITIALIZING" ||
      latest.readyState === "QUEUED" ||
      latest.readyState === "BUILDING";

    const normalizedStatus = mapVercelStateToStatus(latest.readyState);
    const environment = mapVercelTargetToEnvironment(latest.target);

    return {
      found: true,
      isPending,
      vercelDeploymentId: latest.uid,
      url: latest.url ? (latest.url.startsWith("http") ? latest.url : `https://${latest.url}`) : undefined,
      status: normalizedStatus,
      rawState: latest.readyState,
      environment,
      commitSha,
      branch: latest.meta?.githubCommitRef || "unknown",
      createdAt: latest.created ? new Date(latest.created).toISOString() : undefined,
      metadata: {
        inspectorUrl: latest.inspectorUrl,
        name: latest.name,
      },
    };
  }
}
