export interface VercelRawDeployment {
  uid: string;
  name?: string;
  url?: string;
  created?: number;
  state?: string;
  readyState?: string;
  target?: string | null;
  meta?: Record<string, string | undefined>;
  [key: string]: unknown;
}

export interface VercelDeploymentInfo {
  id: string;
  url: string;
  name: string;
  state: "INITIALIZING" | "BUILDING" | "READY" | "ERROR" | "CANCELED" | "UNKNOWN";
  commitSha: string;
  branch?: string;
  inspectorUrl?: string;
  createdAt: number;
  ready?: number;
}

export interface VercelCorrelationResult {
  found: boolean;
  deployment?: VercelDeploymentInfo;
  isProcessing?: boolean;
  isPending?: boolean;
  status?: string;
  error?: string;
}

export interface VercelQueryOptions {
  apiToken?: string;
  token?: string;
  projectId?: string;
  teamId?: string;
  fetchFn?: typeof fetch;
}

export class VercelApiError extends Error {
  public statusCode: number;
  public details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    // Redact raw tokens from error messages
    const sanitizedMessage = message.replace(/(Bearer\s+)[A-Za-z0-9_\-]+/gi, "$1[REDACTED]")
      .replace(/secret_[a-zA-Z0-9_\-]+/gi, "[REDACTED_SECRET]");
    super(sanitizedMessage);
    this.name = "VercelApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class VercelClient {
  private token: string;
  private teamId?: string;
  private projectId?: string;
  private fetchFn: typeof fetch;

  constructor(options: {
    token?: string;
    teamId?: string;
    projectId?: string;
    fetchFn?: typeof fetch;
  }) {
    this.token = options.token || process.env.VERCEL_API_TOKEN || "";
    this.teamId = options.teamId || process.env.VERCEL_TEAM_ID;
    this.projectId = options.projectId || process.env.VERCEL_PROJECT_ID;
    this.fetchFn = options.fetchFn || fetch;
  }

  private sanitizeError(rawMessage: string): string {
    if (!this.token) return rawMessage;
    return rawMessage.split(this.token).join("[REDACTED_TOKEN]");
  }

  public async getDeployment(id: string): Promise<VercelRawDeployment> {
    const url = new URL(`https://api.vercel.com/v13/deployments/${id}`);
    if (this.teamId) url.searchParams.set("teamId", this.teamId);

    const response = await this.fetchFn(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      const safeMsg = this.sanitizeError(text);
      throw new VercelApiError(response.status, `Vercel API error (${response.status}): ${safeMsg}`);
    }

    return (await response.json()) as VercelRawDeployment;
  }

  public async listDeploymentsByCommit(commitSha: string): Promise<VercelRawDeployment[]> {
    const url = new URL("https://api.vercel.com/v6/deployments");
    if (this.projectId) url.searchParams.set("projectId", this.projectId);
    if (this.teamId) url.searchParams.set("teamId", this.teamId);
    url.searchParams.set("limit", "20");

    const response = await this.fetchFn(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      const safeMsg = this.sanitizeError(text);
      throw new VercelApiError(response.status, `Vercel API error (${response.status}): ${safeMsg}`);
    }

    const data = (await response.json()) as { deployments?: VercelRawDeployment[] };
    const list = data.deployments || [];

    const normalizedTarget = commitSha.trim().toLowerCase();
    return list.filter((d) => {
      const sha = (d.meta?.githubCommitSha || d.meta?.commitId || "").toLowerCase();
      return (
        sha === normalizedTarget ||
        (normalizedTarget.length >= 7 && sha.startsWith(normalizedTarget)) ||
        (sha.length >= 7 && normalizedTarget.startsWith(sha))
      );
    });
  }

  public async correlateDeployment(commitSha: string): Promise<VercelCorrelationResult> {
    const matchedList = await this.listDeploymentsByCommit(commitSha);

    if (!matchedList || matchedList.length === 0) {
      return {
        found: false,
        isPending: true,
        isProcessing: true,
        status: "QUEUED",
      };
    }

    const matched = matchedList[0];
    const rawState = (matched.readyState || matched.state || "UNKNOWN").toUpperCase();
    const isPending = rawState === "BUILDING" || rawState === "INITIALIZING";

    let status = "QUEUED";
    if (rawState === "READY") status = "DEPLOYED";
    else if (rawState === "ERROR" || rawState === "CANCELED") status = "FAILED";
    else if (isPending) status = "QUEUED";

    return {
      found: true,
      isPending,
      isProcessing: isPending,
      status,
      deployment: {
        id: String(matched.uid || matched.id || ""),
        url: matched.url ? `https://${matched.url}` : "",
        name: String(matched.name || ""),
        state: rawState as VercelDeploymentInfo["state"],
        commitSha: String(matched.meta?.githubCommitSha || commitSha),
        branch: matched.meta?.githubCommitRef ? String(matched.meta.githubCommitRef) : undefined,
        inspectorUrl: matched.inspectorUrl ? String(matched.inspectorUrl) : undefined,
        createdAt: Number(matched.created || Date.now()),
        ready: matched.ready ? Number(matched.ready) : undefined,
      },
    };
  }
}

/**
 * Functional helper: queries Vercel API and correlates deployment by Git commit SHA.
 */
export async function correlateVercelDeployment(
  commitSha: string,
  options: VercelQueryOptions = {}
): Promise<VercelCorrelationResult> {
  const token = options.token || options.apiToken || process.env.VERCEL_API_TOKEN;
  if (!token) {
    return {
      found: false,
      isProcessing: false,
      isPending: false,
      error: "VERCEL_API_TOKEN not configured; skipping remote Vercel correlation",
    };
  }

  try {
    const client = new VercelClient({
      token,
      projectId: options.projectId,
      teamId: options.teamId,
      fetchFn: options.fetchFn,
    });
    return await client.correlateDeployment(commitSha);
  } catch (err) {
    return {
      found: false,
      isProcessing: false,
      isPending: false,
      error: `Vercel correlation failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
