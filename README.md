# ReleaseTrace — Persistent-Memory Release Intelligence Agent

> **"Hindsight memory informs. Current evidence verifies. The engineer decides."**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black.svg)](https://nextjs.org/)
[![Hindsight](https://img.shields.io/badge/Memory-Hindsight%20Cloud-8b5cf6.svg)](https://vectorize.io)
[![Prisma](https://img.shields.io/badge/ORM-Prisma%206-2d3748.svg)](https://www.prisma.io/)
[![Neon](https://img.shields.io/badge/Database-Neon%20Postgres-00e599.svg)](https://neon.tech/)
[![Inngest](https://img.shields.io/badge/Workflows-Inngest-f59e0b.svg)](https://www.inngest.com/)
[![Groq](https://img.shields.io/badge/LLM-Groq-f97316.svg)](https://groq.com/)
[![Band AI](https://img.shields.io/badge/Band%20AI-Connected%20Live%20Agent-6366f1.svg)](https://app.band.ai)
[![Tests](https://img.shields.io/badge/Tests-101%20passing-10b981.svg)](https://vitest.dev/)

---

## 1. Overview & Vision

**ReleaseTrace** is a persistent-memory DevOps intelligence agent designed for **Next.js deployments on Vercel** coupled with **PostgreSQL and Prisma migrations**.

Traditional CI/CD monitors and generic AI chatbots are stateless: they evaluate each release in isolation and repeat historical deployment mistakes. ReleaseTrace solves this by establishing an immutable, project-isolated **semantic memory bank in Hindsight Cloud**. 

When a deployment occurs:
1. **Grounded Current Evidence**: Captures Git commit, branch, build artifacts, test summaries, and Prisma migration state.
2. **Persistent Memory Recall**: Recalls verified past engineering resolutions and post-mortems from Hindsight Cloud.
3. **Environment Comparison**: Formulates a deterministic diff between historical incident environments (e.g. database pool, runtime, flags) and the current release environment.
4. **Deterministic Risk Safeguards**: Enforces strict deterministic rules (`HIGH_RISK`, `REVIEW_REQUIRED`, `LOW_KNOWN_RISK`, `INSUFFICIENT_EVIDENCE`) before invoking AI synthesis.
5. **Grounded AI Synthesis (Groq)**: Generates context-rich explanations validated with Zod schemas. The LLM explains grounded findings; it cannot invent risk classifications.
6. **Human Engineer Gate**: Only verified engineering experiences confirmed by human engineers are retained back into Hindsight Cloud. Speculative LLM hypotheses are strictly rejected.

---

## 2. System Architecture

```mermaid
flowchart TD
    subgraph Ingestion["1. Ingestion Tier"]
        GHA["GitHub Actions Runner"] -->|Signed HMAC SHA-256 Webhook| API["/api/webhooks/deployments"]
        VERCEL["Vercel Deployment API"] -.->|Correlate Commit SHA| API
    end

    subgraph Orchestration["2. Background Workflows (Inngest)"]
        API -->|Enqueue Event| INNGEST["Inngest Durable Workflows"]
        INNGEST --> S1["Step 1: Upsert Deployment Record"]
        S1 --> S2["Step 2: Recall Memory from Hindsight"]
        S2 --> S3["Step 3: Environment Comparison"]
        S3 --> S4["Step 4: Deterministic Risk Engine"]
        S4 --> S5["Step 5: Groq Grounded Synthesis"]
        S5 --> S6["Step 6: Persist Assessment"]
    end

    subgraph MemoryTier["3. Persistent Memory (Hindsight Cloud)"]
        HS[("Hindsight Cloud\n(Project Memory Bank)")]
        S2 <-->|Semantic Recall\n(Filter: BankId + Domain Tags)| HS
        CONFIRM["Engineer Verification UI"] -->|Retain Confirmed Case Only| HS
    end

    subgraph DatabaseTier["4. Relational Storage (Neon PostgreSQL + Prisma)"]
        NEON[("Neon Postgres Database\n(Deployments, Assessments, AuditLogs, Resolutions)")]
        S6 --> NEON
        CONFIRM --> NEON
    end

    subgraph UITier["5. Product Dashboard (Next.js 15)"]
        DASH["Pre-Flight Release Dashboard"]
        EXPLORE["Hindsight Memory Bank Explorer"]
        LAB["Interactive Learning Lab (Cold vs Warm Rehearsal)"]
        DASH <--> NEON
        EXPLORE <--> HS
        LAB <--> INNGEST
    end
```

---

## 3. Core Product Behavior & Invariants

| Invariant | ReleaseTrace Implementation |
| :--- | :--- |
| **Separation of Evidence vs Memory** | Current deployment telemetry is never blended with historical memory records. Memories provide context; current evidence verifies reality. |
| **Empty-Memory Abstention Path** | When no historical memory exists, ReleaseTrace explicitly abstains from memory claims and executes baseline deterministic checks without hallucination. |
| **Environment Divergence Detection** | Flags when a historical incident occurred under different preconditions (e.g. Node 20 vs 22, connection pool size 15 vs 60, PgBouncer active). |
| **Human-in-the-Loop Retention Gate** | A speculative LLM suggestion is never retained into Hindsight. A memory is committed only when an authorized engineer verifies root cause and resolution. |
| **Contradiction Detection** | Detects and surfaces mutually contradictory historical resolutions (e.g. "Disable pooling" vs "Enforce PgBouncer"). |
| **Replay-Safe Signed Ingestion** | All deployment webhooks verify timing-safe HMAC-SHA256 signatures with 300-second timestamp drift boundaries. |

---

## 4. Workstream Boundaries & Frozen Contracts

All modules import canonical data contracts from `src/contracts/index.ts`:

- `DeploymentEvidence`: Grounded commit SHA, tests, build logs, Prisma migration state.
- `DeploymentEvent`: Signed ingestion payload from GitHub Actions / Vercel.
- `DeploymentMemoryCase`: Structured unit of verified experience retained in Hindsight.
- `MemoryRecallResult`: Semantic recall results, provenance, relevance score.
- `EnvironmentComparison`: Parameter-level diff between historical and current environments.
- `RiskFinding`: Grounded finding citing evidence keys and memory IDs.
- `ReleaseAssessment`: Full assessment, recommendations, checklist, and Groq metadata.
- `VerifiedResolution`: Human-confirmed incident outcome.

---

## 5. Getting Started & Setup

### Prerequisites
- Node.js `v22.x` or higher
- npm `v10.x` or higher

### Environment Configuration
Copy the configuration template:
```bash
cp .env.example .env
```

Configure your environment variables:
```bash
# Neon PostgreSQL
DATABASE_URL="postgresql://user:password@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://user:password@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Hindsight Cloud
HINDSIGHT_BASE_URL="https://api.hindsight.vectorize.io"
HINDSIGHT_API_KEY="your-hindsight-api-key"

# Groq LLM
GROQ_API_KEY="your-groq-api-key"
GROQ_MODEL="openai/gpt-oss-120b"

# Webhook Security (HMAC-SHA256)
RELEASETRACE_WEBHOOK_SECRET="your-secure-webhook-secret-32-chars-min"
RELEASETRACE_ENDPOINT="https://your-domain.com/api/webhooks/deployments"

# Vercel Integration (Optional for live API correlation)
VERCEL_TOKEN="your-vercel-api-token"
VERCEL_TEAM_ID="team_xxx" # optional if personal account
VERCEL_PROJECT_ID="prj_xxx" # optional project scope
```

### Installation
```bash
npm install --legacy-peer-deps
```

### Database Client Generation & Migrations
```bash
npm run db:generate
# To apply migrations to your Neon database:
# npx prisma migrate deploy
```

### GitHub Actions CI/CD Setup
1. In your GitHub repository settings, navigate to **Settings > Secrets and variables > Actions**.
2. Add the following repository secrets:
   - `RELEASETRACE_WEBHOOK_SECRET`: The shared secret matching your server configuration.
   - `RELEASETRACE_ENDPOINT`: The public URL to your `/api/webhooks/deployments` endpoint.
   - `DATABASE_URL`: Your Neon database pooled connection string (optional in CI).
3. The `.github/workflows/releasetrace-ci.yml` workflow automatically runs on `push` and `pull_request` to `main`, executing build checks, tests, Prisma schema validations, assembling migration evidence, and dispatching signed deployment events.

---

## 6. Verification & Quality Gates

Run the automated test suite (60 unit and integration tests):
```bash
npm run test
```

Run TypeScript compilation check:
```bash
npx tsc --noEmit
```

Run ESLint verification:
```bash
npm run lint
```

Execute Next.js production build:
```bash
npm run build
```

---

## 7. Demonstrations & Reproducible Scenarios

### A. Live Hindsight Cloud Smoke Test
Run the official smoke test harness connecting via `@vectorize-io/hindsight-client`:
```bash
npm run smoke:hindsight
```
*Note: If `HINDSIGHT_API_KEY` is present, executes live handshake, bank creation, retain, and recall against Hindsight Cloud. If absent, runs the adapter diagnostic and reports exact missing keys.*

### B. Reproducible Before/After Rehearsal Scenario
Run the 8-stage sequence (A -> H) demonstrating the evolutionary transformation from empty memory to verified experience:
```bash
npm run rehearse
# or
npm run demo
```

**Verifiable Output Demonstration:**
- **State A (Empty Memory Bank)**:
  - Recalled Memories: `0`
  - Recommendation: *"Proceed with standard canary rollout and telemetry monitoring."*
- **State G (After Retaining Experience & Recalling Similar Deployment)**:
  - Recalled Memories: `1` (Case ID: `case-pay-pool-001`)
  - Transformed Recommendation: *"Apply confirmed historical mitigation: Add `SET lock_timeout = "2s";` before DDL statements and reduce maxIdleTimeoutMs to 5000ms with PgBouncer connection pooling."*
  - Historical Conditions Attached: `nodejs@20.11.0, postgresql v14.2, pool: 15`

### C. Interactive Web Dashboard
Start the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000):
- **`/dashboard`**: Pre-flight release engineering dashboard with real-time risk gauges.
- **`/deployments`**: Timeline of recent deployments, correlation status, and Prisma migration indicators.
- **`/deployments/[id]`**: Granular assessment detail, cited evidence, environment comparison card, and human verification checklist.
- **`/memories`**: Memory Bank Explorer showing project memory banks, provenance, and human retention audit logs.
### D. Dedicated Band AI Agent Worker
Connect ReleaseTrace as a persistent collaborative SRE agent in Band:
```bash
npm run band:agent
```
For complete setup, room mention protocols, and persistence guides, see [Band Integration Guide](docs/BAND_INTEGRATION.md).

---

## 8. License

MIT © 2026 ReleaseTrace Engineering Team.
