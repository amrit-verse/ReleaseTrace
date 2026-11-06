# ReleaseTrace System Architecture

## 1. Executive Summary

**ReleaseTrace** is a persistent-memory DevOps release intelligence agent. Unlike stateless CI/CD checks or generic LLM wrappers, ReleaseTrace retains verified engineering experiences across deployments in **Hindsight Cloud** (semantic memory system with isolated memory banks). 

When a new release occurs, ReleaseTrace:
1. Gathers current grounded evidence (Git, tests, build logs, Prisma migrations).
2. Recalls relevant historical release outcomes and past failures from Hindsight.
3. Compares the current execution environment with historical environments.
4. Executes a deterministic, testable risk rule engine.
5. Employs Groq LLM to synthesize an evidence-grounded explanation.
6. Awaits engineer verification before retaining any resolution back to Hindsight.

**Guiding Axiom: Hindsight memory informs. Current evidence verifies. The engineer decides.**

---

## 2. High-Level Architecture Diagram

```mermaid
flowchart TD
    subgraph Ingestion["Ingestion Tier"]
        GHA["GitHub Actions Runner"] -->|Signed HMAC SHA-256 Webhook| API["/api/webhooks/deployments"]
        VERCEL["Vercel Deployment API"] -.->|Polling / Correlate SHA| API
    end

    subgraph Orchestration["Background Execution (Inngest)"]
        API -->|Enqueue Event| INNGEST["Inngest Durable Workflows"]
        INNGEST --> STEP1["Step 1: Normalize & Verify Evidence"]
        STEP1 --> STEP2["Step 2: Recall Memory from Hindsight"]
        STEP2 --> STEP3["Step 3: Environment Comparison"]
        STEP3 --> STEP4["Step 4: Deterministic Risk Engine"]
        STEP4 --> STEP5["Step 5: Groq Grounded Synthesis"]
        STEP5 --> STEP6["Step 6: Persist Assessment to Neon PostgreSQL"]
    end

    subgraph MemoryTier["Persistent Memory (Hindsight Cloud)"]
        HS[("Hindsight Cloud\nIsolated Memory Bank per Project")]
        STEP2 <-->|Semantic Recall\n(Filter: BankId + Domain Tags)| HS
        RESOLVE["Engineer Verification UI"] -->|Retain Confirmed Case Only| HS
    end

    subgraph Storage["Relational Storage (Neon PostgreSQL + Prisma)"]
        NEON[("Neon Postgres Database\n(Workspaces, Projects, Deployments, Assessments, AuditLogs)")]
        STEP6 --> NEON
        RESOLVE --> NEON
    end

    subgraph UI["Product Tier (Next.js App Router)"]
        DASH["ReleaseTrace Dashboard"]
        EXPLORE["Memory Bank Explorer"]
        LAB["Learning Lab (Rehearsal Before/After)"]
        DASH <--> NEON
        EXPLORE <--> HS
        LAB <--> INNGEST
    end
```

---

## 3. Core Architectural Boundaries & Workstreams

| Workstream | Key Responsibilities | Primary Directories |
| :--- | :--- | :--- |
| **Platform** | Ingestion webhook endpoint, HMAC verification, Vercel correlation, Inngest durable steps, Prisma schema & Neon pooled connection. | `src/app/api/webhooks/`, `src/lib/inngest/`, `src/lib/db/`, `prisma/` |
| **Memory Intelligence** | `@vectorize-io/hindsight-client` wrapper, Groq LLM integration, environment diff engine, deterministic risk rules, verified retention pipeline. | `src/lib/hindsight/`, `src/lib/groq/`, `src/lib/risk-engine/`, `src/lib/memory/` |
| **Product Dashboard** | Next.js App Router frontend, release assessment views, memory provenance visualizer, human resolution confirmation form, interactive rehearsal lab. | `src/app/`, `src/components/`, `src/lib/actions/` |

---

## 4. Key Architectural Safeguards

1. **Empty-Memory Abstention Path**: When no relevant historical case exists, ReleaseTrace explicitly declares an empty memory state and executes baseline rules without hallucination.
2. **Environment Divergence Detection**: If historical failure occurred in Preview but current release is Production, the environment comparison surfaces the mismatch and flags risk implications.
3. **Verified Retention Gate**: Speculative LLM suggestions are NEVER retained into Hindsight. A memory is committed only when a human engineer explicitly verifies the root cause and applied fix.
4. **Zero Shell Execution**: The agent never runs autonomous production shell commands or unprompted schema alterations.
5. **Signed Webhook Ingestion**: All incoming deployment webhooks are verified using HMAC SHA-256 with timestamp replay prevention (5-minute drift threshold).
