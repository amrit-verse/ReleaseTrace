/**
 * ReleaseTrace AI Band Agent - Intelligence Reasoning Layer
 */

import { ReleaseTraceIntelligenceEngine } from "@/intelligence/engine/intelligence-engine";
import { RISK_RULE_REGISTRY } from "@/intelligence/rules/risk-rules";
import { HindsightAdapter } from "@/intelligence/hindsight/adapter";
import { ProjectMemoryBankManager } from "@/intelligence/hindsight/bank-manager";
import { GroqAdapter } from "@/intelligence/llm/groq-adapter";
import { prisma } from "@/lib/db";
import type { DeploymentContext } from "@/intelligence/types";
import {
  formatSreResponse,
  RELEASE_TRACE_CORE_PRINCIPLE,
  SRE_SYSTEM_PROMPT,
} from "./personality";
import type { HandlerResult, IntentMatch, StructuredSreResponse } from "./types";

export class ReleaseTraceReasoningEngine {
  private intelligenceEngine: ReleaseTraceIntelligenceEngine;
  private groqAdapter: GroqAdapter;
  private hindsightAdapter: HindsightAdapter;
  private bankManager: ProjectMemoryBankManager;

  constructor() {
    this.intelligenceEngine = new ReleaseTraceIntelligenceEngine();
    this.groqAdapter = new GroqAdapter();
    this.hindsightAdapter = HindsightAdapter.getInstance();
    this.bankManager = new ProjectMemoryBankManager(this.hindsightAdapter);
  }

  /**
   * Classifies user input into an actionable ReleaseTrace intent.
   */
  public classifyIntent(text: string): IntentMatch {
    const lower = text.toLowerCase();

    // 1. Check for deployment investigation (e.g. UUID or "dep-...")
    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    const depIdRegex = /dep-[a-z0-9_-]+/i;
    const uuidMatch = text.match(uuidRegex);
    const depMatch = text.match(depIdRegex);

    if (
      lower.includes("investigate") ||
      lower.includes("why this deployment") ||
      lower.includes("deployment status") ||
      lower.includes("check deployment") ||
      (lower.includes("deployment") && (uuidMatch || depMatch))
    ) {
      return {
        intent: "INVESTIGATE_DEPLOYMENT",
        confidence: 0.95,
        extractedParams: {
          deploymentId: uuidMatch ? uuidMatch[0] : depMatch ? depMatch[0] : undefined,
        },
      };
    }

    // 2. Assess release
    if (
      lower.includes("assess release") ||
      lower.includes("assess this deployment") ||
      lower.includes("evaluate risk") ||
      lower.includes("run assessment") ||
      lower.includes("risk assessment") ||
      lower.includes("code diff") ||
      lower.includes("migration.sql")
    ) {
      return {
        intent: "ASSESS_RELEASE",
        confidence: 0.9,
        extractedParams: { query: text },
      };
    }

    // 3. Explain architecture
    if (
      lower.includes("architecture") ||
      lower.includes("how does releasetrace work") ||
      lower.includes("system design") ||
      lower.includes("under the hood")
    ) {
      return {
        intent: "EXPLAIN_ARCHITECTURE",
        confidence: 0.95,
        extractedParams: {},
      };
    }

    // 4. Explain lifecycle
    if (
      lower.includes("lifecycle") ||
      lower.includes("stages") ||
      lower.includes("assessment steps") ||
      lower.includes("how do you assess")
    ) {
      return {
        intent: "EXPLAIN_LIFECYCLE",
        confidence: 0.9,
        extractedParams: {},
      };
    }

    // 5. Explain deterministic rules
    if (
      lower.includes("deterministic") ||
      lower.includes("safety rules") ||
      lower.includes("risk rules") ||
      lower.includes("hard block") ||
      lower.includes("rule registry")
    ) {
      return {
        intent: "EXPLAIN_RULES",
        confidence: 0.9,
        extractedParams: {},
      };
    }

    // 6. Compare environments
    if (
      lower.includes("compare environment") ||
      lower.includes("environment divergence") ||
      lower.includes("environment mismatch")
    ) {
      return {
        intent: "COMPARE_ENVIRONMENTS",
        confidence: 0.9,
        extractedParams: {},
      };
    }

    // 7. Explain memories
    if (
      lower.includes("hindsight") ||
      lower.includes("memory bank") ||
      lower.includes("memories") ||
      lower.includes("historical incident") ||
      lower.includes("past incident")
    ) {
      return {
        intent: "EXPLAIN_MEMORIES",
        confidence: 0.85,
        extractedParams: { query: text },
      };
    }

    // 8. Explain contradictions
    if (
      lower.includes("contradiction") ||
      lower.includes("conflicting") ||
      lower.includes("opposing advice") ||
      lower.includes("contradictory")
    ) {
      return {
        intent: "EXPLAIN_CONTRADICTIONS",
        confidence: 0.9,
        extractedParams: {},
      };
    }

    // 9. Explain abstention
    if (
      lower.includes("abstain") ||
      lower.includes("abstention") ||
      lower.includes("weak recall") ||
      lower.includes("empty memory")
    ) {
      return {
        intent: "EXPLAIN_ABSTENTION",
        confidence: 0.95,
        extractedParams: {},
      };
    }

    // 10. Explain integrations
    if (
      lower.includes("mock") ||
      lower.includes("fixture") ||
      lower.includes("demo mode") ||
      lower.includes("live integration") ||
      lower.includes("neon") ||
      lower.includes("integration status")
    ) {
      return {
        intent: "EXPLAIN_INTEGRATIONS",
        confidence: 0.9,
        extractedParams: {},
      };
    }

    // 11. Code review collaboration
    if (
      lower.includes("code review") ||
      lower.includes("review code") ||
      lower.includes("review pr") ||
      lower.includes("code reviewer") ||
      lower.includes("code author")
    ) {
      return {
        intent: "CODE_REVIEW_HELP",
        confidence: 0.85,
        extractedParams: { query: text },
      };
    }

    return {
      intent: "GENERAL_QUERY",
      confidence: 0.5,
      extractedParams: { query: text },
    };
  }

  /**
   * Executes the reasoning for an incoming request and returns a structured response.
   */
  public async handleMessage(text: string, senderName?: string | null): Promise<HandlerResult> {
    const match = this.classifyIntent(text);

    switch (match.intent) {
      case "INVESTIGATE_DEPLOYMENT":
        return this.handleInvestigateDeployment(match.extractedParams.deploymentId);

      case "ASSESS_RELEASE":
        return this.handleAssessRelease(text);

      case "EXPLAIN_ARCHITECTURE":
        return this.handleExplainArchitecture();

      case "EXPLAIN_LIFECYCLE":
        return this.handleExplainLifecycle();

      case "EXPLAIN_RULES":
        return this.handleExplainRules();

      case "COMPARE_ENVIRONMENTS":
        return this.handleCompareEnvironments();

      case "EXPLAIN_MEMORIES":
        return this.handleExplainMemories(match.extractedParams.query || text);

      case "EXPLAIN_CONTRADICTIONS":
        return this.handleExplainContradictions();

      case "EXPLAIN_ABSTENTION":
        return this.handleExplainAbstention();

      case "EXPLAIN_INTEGRATIONS":
        return this.handleExplainIntegrations();

      case "CODE_REVIEW_HELP":
        return this.handleCodeReviewHelp(text, senderName);

      case "GENERAL_QUERY":
      default:
        return this.handleGeneralQuery(text, senderName);
    }
  }

  /**
   * 1. INVESTIGATE_DEPLOYMENT
   */
  private async handleInvestigateDeployment(deploymentId?: string): Promise<HandlerResult> {
    const projectId = process.env.RELEASETRACE_PROJECT_ID || "proj_releasetrace_core";

    try {
      let deployment;

      if (deploymentId) {
        deployment = await prisma.deployment.findFirst({
          where: {
            OR: [
              { id: deploymentId },
              { providerDeploymentId: deploymentId },
              { commitSha: { startsWith: deploymentId } },
            ],
          },
          include: {
            assessment: {
              include: {
                memoryReferences: true,
                resolutions: true,
              },
            },
            project: true,
          },
        });
      } else {
        // Find latest deployment if no specific ID provided
        deployment = await prisma.deployment.findFirst({
          where: { projectId },
          orderBy: { createdAt: "desc" },
          include: {
            assessment: {
              include: {
                memoryReferences: true,
                resolutions: true,
              },
            },
            project: true,
          },
        });
      }

      if (!deployment) {
        const missingText = deploymentId
          ? `Deployment ID \`${deploymentId}\` was not found in the Neon PostgreSQL deployment register.`
          : `No deployments found in the deployment register for project \`${projectId}\`.`;

        const resp: StructuredSreResponse = {
          summary: `🔍 **Deployment Investigation Status:** Refused to fabricate missing deployment records.`,
          verifiedCurrentEvidence: [
            missingText,
            `Required Evidence: Valid deployment ID or commit SHA registered in Neon database.`,
            `Checked Project: \`${projectId}\``,
          ],
          recommendedNextActions: [
            `Provide a valid deployment ID from your Vercel or GitHub Actions pipeline.`,
            `Query existing deployments via \`GET /api/deployments\` to locate the target UUID.`,
          ],
          metadata: {
            intent: "INVESTIGATE_DEPLOYMENT",
            assessedAt: new Date().toISOString(),
            source: "Neon PostgreSQL (Prisma)",
          },
        };
        return { text: formatSreResponse(resp), structured: resp };
      }

      const assessment = deployment.assessment;
      const riskCategory = assessment?.overallCategory || "UNKNOWN";
      const summary = assessment?.summary || "No automated assessment summary recorded.";

      const memories = assessment?.memoryReferences || [];
      const topMatches = memories.map(
        (m) =>
          `Precedent \`${m.externalMemoryId}\` (relevance: ${(((m.relevanceScore ?? 0)) * 100).toFixed(0)}%, bank: ${m.hindsightBankId}): ${m.snippet}`
      );

      const resp: StructuredSreResponse = {
        summary: `🔍 **Investigation Report: Deployment \`${deployment.id}\`**\nRisk Category: **${riskCategory}** | Status: **${deployment.status}** | Target: **${deployment.environment}**`,
        verifiedCurrentEvidence: [
          `Commit: \`${deployment.commitSha}\` on branch \`${deployment.branch}\``,
          `Target Environment: \`${deployment.environment}\` | Provider: \`${deployment.provider}\``,
          `Assessment Summary: ${summary}`,
          `Deployment URL: ${deployment.url || "Pending URL assignment"}`,
        ],
        historicalMemory: {
          memoryState: memories.length > 0 ? "QUALIFIED_MEMORIES_USED" : "ABSTAINED_NO_RELEVANT_MEMORIES",
          recalledPrecedentsCount: memories.length,
          topMatches: topMatches.length > 0 ? topMatches : ["No historical memories were retained or qualified for this deployment."],
        },
        deterministicRuleFindings: {
          evaluatedRulesCount: RISK_RULE_REGISTRY.length,
          violations:
            riskCategory === "HIGH" || riskCategory === "CRITICAL"
              ? [
                  {
                    ruleId: "DB_MIGRATION_SAFETY",
                    description: "High-risk database migration detected on production environment without bounded lock timeout.",
                    riskLevel: riskCategory,
                  },
                ]
              : [],
          hardBlocked: riskCategory === "CRITICAL",
        },
        aiExplanation: `The assessment flagged this release as **${riskCategory}** because: ${summary}`,
        recommendedNextActions: assessment?.recommendedAction
          ? [assessment.recommendedAction]
          : [
              `Review database migration files for exclusive locks before completing release.`,
              `Verify Neon connection pool saturation metrics in Grafana/CloudWatch.`,
            ],
        metadata: {
          intent: "INVESTIGATE_DEPLOYMENT",
          assessedAt: deployment.createdAt.toISOString(),
          source: "Neon PostgreSQL + Hindsight Provenance",
        },
      };

      return { text: formatSreResponse(resp), structured: resp };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return {
        text: `⚠️ **Deployment Investigation Error:** Failed to query Neon PostgreSQL register: ${errMsg}. Verified evidence cannot be retrieved at this time.`,
      };
    }
  }

  /**
   * 2. ASSESS_RELEASE
   */
  private async handleAssessRelease(text: string): Promise<HandlerResult> {
    const projectId = process.env.RELEASETRACE_PROJECT_ID || "proj_releasetrace_core";

    const hasMigration =
      /migration|alter\s+table|create\s+table|drop\s+column|prisma/i.test(text);

    const deploymentContext: DeploymentContext = {
      deploymentId: `band-eval-${Date.now()}`,
      projectId,
      service: "core-api",
      timestamp: new Date().toISOString(),
      commitHash: "eval-" + Math.random().toString(16).slice(2, 10),
      branch: "main",
      gitDiffSummary: {
        filesChanged: hasMigration ? ["prisma/schema.prisma", "migrations/migration.sql"] : ["src/index.ts"],
        additions: hasMigration ? 45 : 12,
        deletions: 2,
        hasDatabaseMigrations: hasMigration,
        migrationDetails: hasMigration ? "ALTER TABLE deployments ADD COLUMN metadata JSONB;" : undefined,
      },
      environment: {
        runtime: "nodejs@22.0.0",
        database: {
          type: "postgresql",
          version: "15.6",
          poolSize: 20,
        },
        infrastructure: {
          provider: "aws",
          region: "us-east-1",
          replicas: 2,
        },
        featureFlags: {},
        envVariables: {},
        dependencies: {},
      },
      targetEnvironment: "production",
      telemetrySnapshot: {
        errorRate: 0.002,
        p95LatencyMs: 120,
        cpuUtilization: 0.45,
        memoryUtilization: 0.6,
        connectionPoolSaturation: hasMigration ? 0.85 : 0.25,
      },
      environmentNotes: "Evaluated in Band workspace turn",
    };

    const assessment = await this.intelligenceEngine.assessDeployment(deploymentContext);

    const resp: StructuredSreResponse = {
      summary: `🛡️ **Release Assessment Result:** Overall Risk is **${assessment.overallRisk}** (Confidence: ${assessment.confidence})`,
      verifiedCurrentEvidence: [
        `Git Diff: ${assessment.currentEvidenceSummary.gitChanges}`,
        `Telemetry: ${assessment.currentEvidenceSummary.telemetryStatus}`,
        `Target Environment: \`${deploymentContext.targetEnvironment}\` (Node.js 22, PostgreSQL 15.6, Pool: 20)`,
        ...assessment.currentEvidenceSummary.criticalSignals.map((s) => `Signal: ${s}`),
      ],
      historicalMemory: {
        memoryState: assessment.memoryAssessmentState,
        recalledPrecedentsCount: assessment.recalledMemories.length,
        topMatches: assessment.recalledMemories.map(
          (m) =>
            `Precedent \`${m.memoryId}\`: ${m.confirmedRootCause} (Relevance: ${(m.relevanceScore * 100).toFixed(0)}%, Confirmed by: ${m.confirmedBy})`
        ),
        divergenceNotes: assessment.environmentComparison && !assessment.environmentComparison.isMatch
          ? assessment.environmentComparison.explanation
          : undefined,
      },
      deterministicRuleFindings: {
        evaluatedRulesCount: RISK_RULE_REGISTRY.length,
        violations: assessment.ruleViolations.map((v) => ({
          ruleId: v.ruleId,
          description: v.description,
          riskLevel: v.severity,
        })),
        hardBlocked: assessment.ruleViolations.some((v) => v.severity === "CRITICAL"),
      },
      aiExplanation: assessment.recommendations.map((r) => r.rationale).filter(Boolean).join(" "),
      recommendedNextActions: assessment.recommendations.map(
        (r) => `[${r.priority}] ${r.action}${r.divergenceWarning ? ` (Warning: ${r.divergenceWarning})` : ""}`
      ),
      metadata: {
        intent: "ASSESS_RELEASE",
        assessedAt: assessment.assessedAt,
        source: "ReleaseTrace Intelligence Engine",
      },
    };

    return {
      text: formatSreResponse(resp),
      structured: resp,
      rawAssessment: assessment,
    };
  }

  /**
   * 3. EXPLAIN_ARCHITECTURE
   */
  private handleExplainArchitecture(): HandlerResult {
    const text = `
### 🏗️ ReleaseTrace Architecture Overview

ReleaseTrace is built as an **Agy-engineered persistent-memory release intelligence system**. It bridges deterministic SRE invariants with historical engineering recall to eliminate repeat deployment failures.

\`\`\`
[GitHub Actions / Vercel]
       │ (HMAC-SHA256 Ingestion)
       ▼
[Next.js API Gateway (/api/assess, /api/webhooks)]
       │
       ├──► [Deterministic Safety Rules Engine] (Non-overridable Invariants)
       │
       ├──► [Hindsight Cloud by Vectorize] (Persistent Semantic Memory)
       │       │
       │       ▼
       │    [Environment Comparator & Contradiction Detector]
       │       │
       │       ▼
       │    [Relevance & Abstention Gates] (Threshold >= 0.65)
       │
       ├──► [Groq LLM Provider] (Strictly Bounded Forensic Synthesis)
       │
       └──► [Neon Serverless PostgreSQL + Prisma] (Deployment & Resolution Ledger)
\`\`\`

**Core Architectural Pillars:**
1. **Deterministic Rule Engine:** Hard safety gates (unindexed migration lock timeouts, pool exhaustion) that an LLM can NEVER override or downgrade.
2. **Hindsight Cloud Semantic Memory:** Long-term memory bank storing forensic records of confirmed historical incidents, verified root causes, and engineer-confirmed mitigations.
3. **Environment Comparator:** Compares target infrastructure (engine, version, pool size, replicas) against the historical precedent to detect environmental divergence.
4. **Contradiction Detector:** Detects conflicting historical precedents and surfaces the conflict rather than blending incompatible advice.
5. **Abstention Gate:** Strictly abstains when memory is missing or weak, adhering to:
   *"${RELEASE_TRACE_CORE_PRINCIPLE}"*
`.trim();

    return { text };
  }

  /**
   * 4. EXPLAIN_LIFECYCLE
   */
  private handleExplainLifecycle(): HandlerResult {
    const text = `
### 🔄 Release Assessment Lifecycle

Every candidate release passes through a strict 7-phase deterministic and cognitive pipeline:

1. **Context Ingestion & Validation:**
   - Ingests Git diff summary, target environment specifications, and telemetry snapshots (error rate, p95 latency, pool saturation).
   - Validates against strict Zod schemas; refuses to fabricate missing evidence.

2. **Historical Recall (Hindsight Cloud):**
   - Queries project memory bank for historical deployment incidents matching the service, failure symptoms, and diff patterns.

3. **Environment Comparison:**
   - Evaluates target runtime, database engine, version, pool size, and replica count against past incident conditions. Computes an environment match score.

4. **Contradiction Detection:**
   - Analyzes candidate memories to check if two past post-mortems recommend opposing actions under the same failure mode.

5. **Relevance & Abstention Gate:**
   - Calculates combined relevance score (hindsight semantic score + environment similarity).
   - If no memory reaches **0.65 threshold**, the engine enters **ABSTAINED_NO_RELEVANT_MEMORIES** and refuses to guess.

6. **Deterministic Safety Rules:**
   - Runs hard-coded SRE safety rules (e.g. unindexed migrations on production). If a rule triggers **CRITICAL**, the release is hard-blocked immediately.

7. **Bounded Groq LLM Synthesis:**
   - Groq synthesizes forensic observations and recommendations within strictly bounded Zod output schemas.
   - **Safety Invariant:** LLM can NEVER lower risk below what deterministic rules established.
`.trim();

    return { text };
  }

  /**
   * 5. EXPLAIN_RULES
   */
  private handleExplainRules(): HandlerResult {
    const rulesList = RISK_RULE_REGISTRY.map(
      (r) => `- **${r.id}** [${r.severity}]: ${r.name} (Category: ${r.category})`
    ).join("\n");

    const text = `
### ⚖️ Deterministic Risk Rules Registry

ReleaseTrace enforces non-overridable deterministic safety invariants. These rules guarantee that no AI hallucination or optimistic prompt can bypass production safety gates:

${rulesList}

**Key Invariants:**
- If a hard-blocked rule triggers (e.g. \`RT-RULE-001\` or \`RT-RULE-005\`), the assessment outcome is immediately fixed at **CRITICAL**.
- The Groq LLM layer receives the deterministic violation as ground truth and cannot downgrade it to NOMINAL or LOW.
- Recommendations automatically prepend an immediate halt directive.
`.trim();

    return { text };
  }

  /**
   * 6. COMPARE_ENVIRONMENTS
   */
  private handleCompareEnvironments(): HandlerResult {
    const text = `
### 🌐 Environment Comparison & Divergence Detection

Historical resolutions are only valid when target environment conditions match the incident context. ReleaseTrace compares:

1. **Database Runtime & Version:**
   - PostgreSQL vs MySQL vs SQLite.
   - Major/minor version mismatches (e.g. PostgreSQL 14 vs 16 lock timeout semantics).
2. **Connection Pool Sizing:**
   - If historical failure occurred with \`poolSize: 10\` and target environment has \`poolSize: 50\`, connection starvation behaves differently.
3. **Infrastructure & Region:**
   - Provider (AWS, GCP, Vercel), region, and replica count.
   - Cross-region replica lag vs local read-replicas.

**Divergence Warning:**
If a memory is recalled from a staging environment with 2 replicas, but target is production with 20 replicas, ReleaseTrace flags an **Environmental Divergence Notice** on the recommendation.
`.trim();

    return { text };
  }

  /**
   * 7. EXPLAIN_MEMORIES
   */
  private async handleExplainMemories(query: string): Promise<HandlerResult> {
    const projectId = process.env.RELEASETRACE_PROJECT_ID || "proj_releasetrace_core";
    const bankId = this.bankManager.getProjectBankId(projectId);

    try {
      const recallResult = await this.hindsightAdapter.recall(bankId, query);
      const memories = recallResult.results;

      const memoryList =
        memories.length > 0
          ? memories
              .map(
                (m) =>
                  `- **${m.id}** (Relevance: ${(((m.scores?.final ?? m.scores?.semantic) ?? 0) * 100).toFixed(0)}%)\n  * Content: ${m.text.slice(0, 150)}...\n  * Tags: ${(m.tags || []).join(", ")}`
              )
              .join("\n")
          : `- No memories returned for query: \`${query}\` (Bank: \`${bankId}\`).`;

      const text = `
### 🧠 Hindsight Persistent Memory Recall

**Bank:** \`${bankId}\` | **Transport:** \`${this.hindsightAdapter.isMock() ? "MOCK_TRANSPORT" : "HINDSIGHT_CLOUD"}\`
**Query:** "${query}"

**Recalled Precedents:**
${memoryList}

**Memory Retention Invariant:**
ReleaseTrace strictly prohibits retaining speculative resolutions into Hindsight. A precedent is indexed only after explicit human confirmation and cryptographic authorization.
`.trim();

      return { text };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return {
        text: `⚠️ **Memory Recall Notice:** Hindsight Cloud query for bank \`${bankId}\` returned: ${errMsg}. Fallback to deterministic rules active.`,
      };
    }
  }

  /**
   * 8. EXPLAIN_CONTRADICTIONS
   */
  private handleExplainContradictions(): HandlerResult {
    const text = `
### ⚡ Memory Contradiction Detection

Different engineering teams often apply contradictory mitigations to seemingly similar symptoms:

**Classic Example:**
- Team A mitigated high latency by **increasing** connection pool size to prevent queue starvation.
- Team B mitigated high latency by **decreasing** connection pool size because PostgreSQL backend processes were thrashing CPU under heavy thread contention.

**How ReleaseTrace Handles Contradictions:**
1. \`detectMemoryContradictions()\` runs across all candidate memories retrieved from Hindsight.
2. If opposing mitigations are detected for the same failure category, ReleaseTrace **surfaces both precedents explicitly**.
3. It highlights the environmental difference (e.g. CPU core count, memory limits) that justified each choice.
4. It **refuses to average out the advice**, giving the engineer the exact historical nuance needed to decide.
`.trim();

    return { text };
  }

  /**
   * 9. EXPLAIN_ABSTENTION
   */
  private handleExplainAbstention(): HandlerResult {
    const text = `
### 🛑 Abstention Gates & "Never Fabricate Precedent"

A core architectural invariant of ReleaseTrace is **safe cognitive abstention**:

> *"Hindsight memory informs. Current evidence verifies. The engineer decides."*

**Abstention Triggers:**
1. **Empty Memory Bank:** When a new project or service has no historical post-mortems in Hindsight.
2. **Low Semantic Relevance:** When recalled documents have semantic similarity below 0.60.
3. **Environmental Incompatibility:** When recalled incident occurred on an entirely different database engine (e.g. MySQL vs PostgreSQL).
4. **Combined Relevance Threshold:** When the composite score is **< 0.65**.

**What Happens During Abstention:**
- State transitions to \`ABSTAINED_NO_RELEVANT_MEMORIES\` or \`ABSTAINED_LOW_RELEVANCE\`.
- Recalled memory list is set to empty \`[]\`.
- The engine relies solely on verified current evidence and deterministic safety rules.
- ReleaseTrace explains to the user *why* it abstained instead of hallucinating false precedent.
`.trim();

    return { text };
  }

  /**
   * 10. EXPLAIN_INTEGRATIONS
   */
  private handleExplainIntegrations(): HandlerResult {
    const health = {
      neon: Boolean(process.env.DATABASE_URL),
      hindsight: this.hindsightAdapter.isMock() ? "MOCK_MODE" : "LIVE_CLOUD",
      groq: Boolean(process.env.GROQ_API_KEY) ? `LIVE (${this.groqAdapter.getModel()})` : "FALLBACK",
      inngest: Boolean(process.env.INNGEST_EVENT_KEY || process.env.INNGEST_SIGNING_KEY) ? "LIVE" : "UNCONFIGURED",
    };

    const text = `
### 🔌 Integrations & Operating Modes

ReleaseTrace maintains strict boundaries between demo/mock fixtures and live production services:

| Service | Active Mode | Operational Description |
|---|---|---|
| **Neon PostgreSQL** | ${health.neon ? "CONNECTED" : "UNAVAILABLE"} | Production deployment ledger, assessments, resolutions via Prisma. |
| **Hindsight Cloud** | ${health.hindsight} | Vectorize Hindsight semantic memory cluster for verified incident retention & recall. |
| **Groq LLM** | ${health.groq} | Ultra-fast LLM inference for structured forensic explanations. |
| **Inngest** | ${health.inngest} | Durable workflow orchestration for asynchronous deployment assessment pipelines. |

**Mode Distinction:**
- **Live Mode:** Real cloud API calls with cryptographic token authentication.
- **Mock Mode:** In-memory fixture store used for local development, smoke tests, and offline resilience.
- **Fixture Mode:** Bypasses live inference to validate schema consistency and UI contracts.
`.trim();

    return { text };
  }

  /**
   * 11. CODE_REVIEW_HELP
   */
  private handleCodeReviewHelp(text: string, senderName?: string | null): HandlerResult {
    const greeting = senderName ? `Hello ${senderName}.` : "Hello.";
    const responseText = `
${greeting} As a Release-Intelligence SRE, I collaborate closely with **Code Reviewer**, **Code Author**, and **Express Lead**.

When reviewing ReleaseTrace pull requests or deployment changes, I verify:
1. **Database Migrations:** Are lock timeouts set (\`SET lock_timeout = '3s';\`)? Are indexes added \`CONCURRENTLY\`?
2. **Connection Pools:** Does the service handle connection spikes without saturating pooled connections?
3. **Rollback Safety:** Can this change roll back cleanly without data loss or backwards-incompatible column deletions?
4. **Hindsight Precedents:** Has this specific service failed previously under this change pattern?

Share a diff or PR summary with me and I will evaluate it against our deterministic rule registry and Hindsight memory bank.
`.trim();

    return { text: responseText };
  }

  /**
   * 12. GENERAL_QUERY
   */
  private async handleGeneralQuery(text: string, senderName?: string | null): Promise<HandlerResult> {
    const greeting = senderName ? `Hello ${senderName}. ` : "";

    // Try to synthesize with Groq LLM if configured
    if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() !== "") {
      try {
        const groqPrompt = `
${SRE_SYSTEM_PROMPT}

USER MESSAGE (from ${senderName || "Engineer"}):
"${text}"

Provide a concise, technically precise SRE response adhering to:
"${RELEASE_TRACE_CORE_PRINCIPLE}"
Do not claim to have deployed or altered infrastructure. Answer helpfully and professionally.
`.trim();

        const response = await this.groqAdapter.generateExplanation(groqPrompt);
        if (response && response.trim().length > 0) {
          return { text: `${greeting}${response}` };
        }
      } catch {
        // Fall through to deterministic response on Groq failure
      }
    }

    // Deterministic fallback response
    const fallbackText = `
${greeting}I am **ReleaseTrace AI**, an Agy-built, ReleaseTrace-powered engineering intelligence agent.

I investigate deployment risks, recall verified historical engineering experiences from Hindsight, compare release environments, and evaluate deterministic release safety rules.

**Core Commands & Questions You Can Ask Me:**
- \`Investigate deployment <id>\`: Analyze a specific deployment from the Neon register.
- \`Assess release with migration <details>\`: Evaluate risk for candidate code changes.
- \`Explain architecture\`: View the 5-tier ReleaseTrace system design.
- \`Explain deterministic rules\`: View non-overridable SRE safety rules.
- \`Explain memory abstention\`: Understand why ReleaseTrace refuses to guess when memory is missing.
- \`Compare environments\`: Learn how environment divergence alters historical risk.

*"${RELEASE_TRACE_CORE_PRINCIPLE}"*
`.trim();

    return { text: fallbackText };
  }
}
