# ReleaseTrace Intelligence System & Persistent Memory Engine

## 1. Executive Summary

ReleaseTrace is an autonomous release risk assessment platform that learns from experience using persistent memory (**Hindsight**) and structured LLM reasoning (**Groq**) combined with deterministic engineering safety rules.

Unlike naive LLM release tools that speculate on code changes, ReleaseTrace adheres to foundational safety and memory invariants:
- **Only engineer-confirmed outcomes may be retained** as verified engineering experiences.
- **Never treat an LLM hypothesis as a verified root cause.**
- **Never treat historical memory as current evidence.**
- **Historical conditions must accompany recommendations.**
- **If conditions differ, explain the mismatch.**
- **If memories contradict each other, surface the conflict.**
- **If recall is weak or the memory bank is empty, abstain rather than hallucinate.**

---

## 2. Core Architecture

```
                                  +---------------------------------------+
                                  |   Candidate Deployment Context        |
                                  | (Git diffs, schema, env, telemetry)   |
                                  +-------------------+-------------------+
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |    Deterministic Release-Risk Rules   |
                                  |  (Destructive DDL, replica floor,     |
                                  |   saturation gates, pool capacity)    |
                                  +-------------------+-------------------+
                                                      |
                           +--------------------------+--------------------------+
                           |                                                     |
                           v                                                     v
          +---------------------------------+                   +---------------------------------+
          |    Hindsight Cloud / Local      |                   |    Environment Comparator       |
          |  (Multi-arm recall: vector,     |                   |  (Runtime, DB engine & pool,    |
          |   BM25 keyword, rerank)         |                   |   replicas, feature flags)      |
          +----------------+----------------+                   +----------------+----------------+
                           |                                                     |
                           +--------------------------+--------------------------+
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |     Memory Relevance & Abstention     |
                                  |  (Composite scoring >= 0.65 floor;    |
                                  |   Abstains if empty or weak)          |
                                  +-------------------+-------------------+
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |   Contradiction Detection Engine      |
                                  |  (Opposing mitigations, conflicting   |
                                  |   causes across historical records)   |
                                  +-------------------+-------------------+
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |          Groq LLM Adapter             |
                                  | (Llama-3.3-70b-versatile, temp=0.0)   |
                                  |   Strict Zod Output Validation        |
                                  +-------------------+-------------------+
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |   Structured Release Assessment       |
                                  | - Categorized Risk Level              |
                                  | - Recalled Provenance & Citations     |
                                  | - Condition Notices & Warnings        |
                                  | - Actionable Recommendations          |
                                  +-------------------+-------------------+
                                                      |
                                    [Deployment Fails in Production]
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |  Human Engineer Root Cause Audit      |
                                  |  (Manual / Postmortem Investigation)  |
                                  +-------------------+-------------------+
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |   Retry-Safe Retention Workflow       |
                                  |  (Idempotent Document ID in Hindsight)|
                                  +---------------------------------------+
```

---

## 3. Implemented Modules

### 3.1 HindsightClient Adapter (`src/intelligence/hindsight/adapter.ts`)
- Singleton server-side client wrapping `@vectorize-io/hindsight-client`.
- Provides connection resilience, health checking (`getVersion()`), and automatic in-memory fallback mode for deterministic local testing without external daemon dependencies.
- Audits and tracks real SDK calls vs mocked calls.

### 3.2 Stable Per-Project Memory Bank Manager (`src/intelligence/hindsight/bank-manager.ts`)
- Deterministically derives project bank IDs: `rt-${sanitizedProjectId}`.
- Configures Hindsight memory banks with specialized missions:
  - `retainMission`: Instructs Hindsight to retain only verified deployment failure experiences and historical environmental conditions.
  - `reflectMission`: Guides reflection to evaluate risk strictly against confirmed outcomes and surface condition mismatches.
  - Multi-arm retrieval: Activates BM25 keyword text search, cross-encoder reranking, and temporal query analysis.

### 3.3 Verified Engineering Memory Schema (`src/intelligence/memory/schema.ts`)
- Zod schema enforcing:
  - Mandatory `isConfirmed: true` boolean literal.
  - Engineer attribution (`confirmedBy`) and ISO timestamp (`confirmedAt`).
  - Minimum 10-character forensic evidence field (`verificationEvidence`).
  - Rejection gatekeeper `assertEngineerConfirmation()`: Throws `UnconfirmedMemoryError` on unverified LLM hypotheses.
  - Lossless serialization to structured prose with ground-truth markers.

### 3.4 Context & Environment Comparator (`src/intelligence/memory/environment-comparator.ts`)
- Detects environmental differences across:
  - Runtime major/minor revisions (e.g. Node 18 vs Node 20).
  - Database engine and major versions (e.g. PostgreSQL 14 vs 16).
  - Connection pool capacity vs deployment replica count.
  - Idle timeouts and feature flags.
- Computes `matchScore` (0.0 to 1.0) and generates condition divergence explanations.

### 3.5 Relevance Scoring & Abstention Engine (`src/intelligence/memory/relevance.ts`)
- Composite relevance calculation:
  $$\text{Score} = (\text{HindsightScore} \times 0.40) + (\text{SignatureSim} \times 0.35) + (\text{EnvMatchScore} \times 0.25)$$
- Strict threshold floor: $0.65$.
- Enforces two abstention modes:
  - `ABSTAINED_NO_RELEVANT_MEMORIES`: Empty memory bank (cold state).
  - `ABSTAINED_WEAK_RECALL`: Candidate memories score below confidence threshold (avoids hallucinations).

### 3.6 Contradiction Detection Engine (`src/intelligence/memory/contradiction-detector.ts`)
- Scans recalled memories for:
  - Opposing mitigations (e.g., "increase connection timeout" vs "decrease connection timeout").
  - Conflicting root causes for identical symptoms (e.g., database lock vs external API timeout).
- Surfaces contradictions in the assessment with resolution guidance.

### 3.7 Deterministic Release-Risk Rules (`src/intelligence/rules/risk-rules.ts`)
- Hard blocks and severity categorizations:
  - `RT-RULE-001` (CRITICAL): Destructive schema migration (`DROP TABLE`, `DROP COLUMN`) on production.
  - `RT-RULE-002` (HIGH): Unsafe index or table migration without lock timeout or concurrency.
  - `RT-RULE-003` (HIGH): Production deployment with single replica (< 2).
  - `RT-RULE-004` (HIGH): Database connection pool over-allocation (> 300 connections).
  - `RT-RULE-005` (CRITICAL): Active pre-deploy error spike (> 5% error rate).
  - `RT-RULE-008` (HIGH): Recurrence of verified historical incident pattern.

### 3.8 Groq LLM Adapter (`src/intelligence/llm/groq-adapter.ts`)
- Official `groq-sdk` integration with configurable model (default: `llama-3.3-70b-versatile`).
- Low temperature (0.0) for deterministic analytical evaluation.
- Strict Zod validation on structured output (`LlmAssessmentOutputSchema`).
- Robust markdown fence stripping and repair fallback.

### 3.9 Retry-Safe Retention Workflow (`src/intelligence/hindsight/retention.ts`)
- Constructs deterministic document IDs (`case-${projectId}-${deploymentId}-${memoryId}`).
- Idempotent: Repeated writes update existing document records without duplicating facts.
- Exponential backoff with jitter on network retries.

---

## 4. Reproducible 8-Stage Demo Workflow

The complete sequence (A -> H) is implemented in `src/intelligence/demo/demo-workflow.ts` and executable via `npm run demo`:

| Stage | Action | State / Output |
| :--- | :--- | :--- |
| **A. Empty memory bank** | Initial release submitted to clean project bank | `ABSTAINED_NO_RELEVANT_MEMORIES`. No historical citations. Baseline canary recommendation. |
| **B. First deployment failure** | Deployment fails in production | `DB_CONNECTION_POOL_EXHAUSTION` recorded with active logs and stack traces. |
| **C. Engineer confirms root cause** | Engineer completes forensic investigation | Root cause: `Unbounded AccessExclusiveLock queued 60 connections`. Confirmed by `sarah.chen@engineering.corp`. |
| **D. Retain verified memory** | Store confirmed case in Hindsight | Stored with idempotent ID `case-payment-gateway-deploy-v1-0-1-case-pay-pool-001`. |
| **E. Similar subsequent deployment** | New migration submitted modifying transactions | Migration: `ALTER TABLE transactions ADD COLUMN risk_score FLOAT;`. |
| **F. Recall previous experience** | Hindsight recalls matching verified case | Memory `case-pay-pool-001` recalled with 0.88 composite relevance score. |
| **G. Visibly different recommendation** | Assessment generated with memory precedent | `ACCUMULATED_EXPERIENCE`. Directly recommends: `Apply confirmed historical mitigation: Add SET lock_timeout = "2s"`. |
| **H. Verify against current evidence** | Cross-check current diff vs historical conditions | Verified that current diff is distinguished from past incident and historical conditions accompany mitigation. |

---

## 5. Verification & Audit Report

### 5.1 Test Execution Summary
- **Total Test Files**: 13/13 passed (100%)
- **Total Tests**: 48/48 passed (100%)
- **Execution Time**: ~770ms

```bash
✓ tests/risk-rules.test.ts (4 tests)
✓ tests/contradiction-detector.test.ts (3 tests)
✓ tests/environment-comparator.test.ts (5 tests)
✓ tests/relevance-and-abstention.test.ts (4 tests)
✓ tests/memory-schema.test.ts (5 tests)
✓ tests/groq-adapter.test.ts (3 tests)
✓ tests/hindsight-retention-recall.test.ts (4 tests)
✓ tests/intelligence-engine.test.ts (3 tests)
✓ tests/demo-workflow.test.ts (1 test)
✓ src/contracts/index.test.ts (3 tests)
✓ tests/platform/signature.test.ts (6 tests)
✓ tests/platform/ingestion-api.test.ts (3 tests)
✓ tests/platform/vercel-correlator.test.ts (4 tests)
```

### 5.2 Real SDK Calls vs Mocked Tests vs Skipped Tests
- **Real SDK Calls Tested**:
  - `client.getVersion()` verified via official `@vectorize-io/hindsight-client` in `scripts/smoke-hindsight.mjs`.
  - Type-level verification of `createBank`, `retain`, `recall`, and `getBankConfig` against `@vectorize-io/hindsight-client@1.2.0` type definitions.
- **Mocked Tests**:
  - All 48 unit and integration tests run with deterministic in-memory mock transports for zero flaky network failures in CI/CD.
- **Skipped Real Network Calls**:
  - Live socket transmission to `http://localhost:8888` is skipped when no local Hindsight daemon is running; automatically reports integration status and falls back to deterministic in-memory store.
- **Outstanding Integration Dependencies**:
  - Running Hindsight daemon on port 8888 (`HINDSIGHT_API_URL`).
  - Active `GROQ_API_KEY` for live production LLM inferences.
