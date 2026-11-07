# ReleaseTrace AI — Band Platform Integration Guide

This guide details the architecture, setup, deployment, and verification of **ReleaseTrace AI** as a live, persistent AI participant in Band collaborative workspaces.

---

## 1. Executive Summary

ReleaseTrace AI is an Agy-built, ReleaseTrace-powered engineering intelligence agent. Rather than functioning as a mock agent, standalone chatbot, or MCP relay, it connects directly as a native Band participant using the official `@band-ai/sdk`.

### Official Identity
- **Display Name:** `ReleaseTrace AI`
- **Description:** *"An Agy-built, ReleaseTrace-powered engineering intelligence agent. Investigates deployment risks, recalls verified historical engineering experiences, compares release environments, explains technical findings, and collaborates with engineers and other agents."*
- **Role in Band:** Senior Site Reliability Engineer (SRE) and Release-Intelligence Specialist.
- **Core Principle:**
  > *"Hindsight memory informs. Current evidence verifies. The engineer decides."*

---

## 2. Architecture & Design Decisions

### Why a Dedicated Worker Process?
ReleaseTrace's web dashboard is hosted on Next.js / Vercel. Serverless routes on Vercel have strict execution time limits and cannot maintain persistent stateful WebSocket connections. 

Therefore, ReleaseTrace AI runs as an **independent, persistent worker process**:
- Connects directly to Band's Phoenix WebSocket protocol.
- Joins assigned rooms automatically (`agentConfig.autoSubscribeExistingRooms = true`).
- Emits real-time typing and working state indicators during reasoning.
- Implements the official `@band-ai/sdk` `GenericAdapter`.
- Runs locally during development (`npm run band:agent`) or in a containerized environment (Docker, systemd, VM, Railway/Render) in production.

### Intelligence Pipeline

```
Band Room Mention (@ReleaseTrace AI)
                 │
                 ▼
[GenericAdapter (src/band-agent/adapter.ts)]
   ├── Self-message guard (prevents echo loops)
   ├── DeduplicationTracker (prevents duplicate turn replies)
   └── Mention extractor & cleaner
                 │
                 ▼
[Reasoning Engine (src/band-agent/reasoning.ts)]
   ├── 1. Ingests query & classifies intent (11 distinct intents)
   ├── 2. Queries Neon PostgreSQL via Prisma (historical deployments & assessments)
   ├── 3. Queries Hindsight Cloud Semantic Bank (precedent retrieval)
   ├── 4. Evaluates Deterministic Safety Rules (unindexed migrations, pool saturation)
   ├── 5. Compares Target Environments & Detects Contradictions
   ├── 6. Evaluates Relevance & Enforces Strict Abstention Gates
   └── 7. Synthesizes Forensic Explanation via Groq LLM
                 │
                 ▼
[SRE Formatter (src/band-agent/personality.ts)]
   ├── 1. Verified Current Evidence
   ├── 2. Historical Memory (Hindsight)
   ├── 3. Deterministic Rule Findings
   ├── 4. AI-Generated Explanation
   └── 5. Recommended Next Action
                 │
                 ▼
[Band tools.sendMessage(reply, mentions)]
   └── Required recipient mention [{ id: senderId }] (Band 422 safeguard)
```

---

## 3. Environment Configuration

### Required Credentials
In your `.env` or persistent hosting environment variables:

```bash
# Band Platform Credentials
BAND_AGENT_ID="88c17522-11f9-4ea7-bcd4-4cd09541c121"
BAND_API_KEY="<your-band-issued-agent-api-key>"

# ReleaseTrace Integrations
DATABASE_URL="postgresql://user:password@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://user:password@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
HINDSIGHT_BASE_URL="https://api.hindsight.vectorize.io"
HINDSIGHT_API_KEY="<your-hindsight-api-key>"
HINDSIGHT_BANK_PREFIX="releasetrace"
GROQ_API_KEY="<your-groq-api-key>"
GROQ_MODEL="openai/gpt-oss-120b"
RELEASETRACE_PROJECT_ID="proj_releasetrace_core"
```

> [!SECURITY]
> Never hardcode credentials, commit `.env`, or expose API keys. The `.gitignore` is configured to ignore all `.env` variants.

---

## 4. Band Registration & Room Setup

### Step 1: Register Agent in Band
1. Log in to [app.band.ai](https://app.band.ai) or launch Band Desktop.
2. Navigate to **Agents** and click **+ New Agent**.
3. Select **External Agent** (connects via external SDK/API).
4. Enter Display Name: `ReleaseTrace AI`.
5. Enter Description:
   > *An Agy-built, ReleaseTrace-powered engineering intelligence agent. Investigates deployment risks, recalls verified historical engineering experiences, compares release environments, explains technical findings, and collaborates with engineers and other agents.*
6. Copy the **Agent UUID** (`BAND_AGENT_ID`) and the one-time **API Key** (`BAND_API_KEY`).
7. Save these in your secure `.env` or deployment secret manager.

### Step 2: Add Agent to Room V1
1. In Band, open the **V1** room (`72db800d-4453-4041-8a2e-0a85ae4c4ea2`).
2. Click the **Participants** header icon (top right).
3. Click **Add Participant**.
4. Select or search for **ReleaseTrace AI** (`amriteshmishra729/releasetrace-ai`).
5. Confirm. ReleaseTrace AI will now be listed in the **Participants** panel under **Agents**.

---

## 5. Local Execution

Run the persistent agent worker locally:

```bash
npm run band:agent
```

Startup output:
```text
======================================================================
  ReleaseTrace AI — Dedicated Band Agent Worker
======================================================================

[Environment Diagnostics]
- Band Configured: YES
- Agent ID: 88c17522-11f9-4ea7-bcd4-4cd09541c121
- Database (Neon): ONLINE
- Hindsight Memory: CLOUD (Prefix: releasetrace)
- Groq LLM: ACTIVE (openai/gpt-oss-120b)
- Inngest Workflows: ONLINE

[Agent Identity]
- Display Name: ReleaseTrace AI
- Description: An Agy-built, ReleaseTrace-powered engineering intelligence agent...
- Connecting to Band WebSocket runtime...
```

To stop the worker, send `Ctrl+C` (`SIGINT`); the worker will execute a graceful shutdown.

---

## 6. Deployment for a Persistent Worker Host

For production, run the worker as a continuous background daemon.

### Option A: Systemd Service (Linux Server / EC2)

Create `/etc/systemd/system/releasetrace-band.service`:

```ini
[Unit]
Description=ReleaseTrace AI Band Agent Worker
After=network.target

[Service]
Type=simple
User=amrit
WorkingDirectory=/home/amrit/Projects/Devnovate
EnvironmentFile=/home/amrit/Projects/Devnovate/.env
ExecStart=/usr/bin/npm run band:agent
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now releasetrace-band
```

### Option B: Dockerfile for Containerized Hosting (Fly.io, Railway, Render, AWS ECS)

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npx prisma generate

ENV NODE_ENV=production

CMD ["npm", "run", "band:agent"]
```

---

## 7. Supported Intelligence Commands & Requests

ReleaseTrace AI handles a wide spectrum of senior SRE interactions:

| Intent | Example Mention in Band Room | Behavior |
|---|---|---|
| **Investigate Deployment** | `@ReleaseTrace AI Investigate why this deployment received a HIGH risk assessment.` | Fetches persisted deployment from Neon, evaluates git diff, migration locks, telemetry, and memory references. |
| **Release Assessment** | `@ReleaseTrace AI Assess release with migration: ALTER TABLE users ADD COLUMN age INT;` | Runs full 7-step intelligence engine, evaluates deterministic safety rules, recalls Hindsight incidents, and outputs structured SRE recommendations. |
| **Architecture** | `@ReleaseTrace AI Explain ReleaseTrace architecture.` | Outlines the 5-layer ingestion, deterministic rules, Hindsight semantic memory, Groq synthesis, and persistence pipeline. |
| **Assessment Lifecycle** | `@ReleaseTrace AI Explain the release assessment lifecycle.` | Steps through the 7-phase evaluation process. |
| **Deterministic Rules** | `@ReleaseTrace AI What deterministic rules do you enforce?` | Lists non-overridable safety rules (RT-RULE-001 through RT-RULE-008). |
| **Memory Abstention** | `@ReleaseTrace AI Why did you abstain from using memory?` | Explains the 0.65 relevance gate and the invariant: *"Hindsight memory informs. Current evidence verifies. The engineer decides."* |
| **Environment Comparison** | `@ReleaseTrace AI Explain environment divergence.` | Explains how target engine, pool size, and replica differences impact historical precedent validity. |
| **Integrations** | `@ReleaseTrace AI Explain demo vs mock vs live integrations.` | Details operational modes for Neon DB, Hindsight Cloud, Groq, and Inngest. |
| **Code Review Collaboration** | `@ReleaseTrace AI Can you help Code Reviewer check this migration?` | Provides collaborative guidance for peer agents (Code Reviewer, Code Author, Express Lead). |

---

## 8. Diagnosis: Legacy Band Desktop / Jam MCP Relay Failure

### Reported Error
> *"Claude Code could not load Band's disposition MCP relay: jam reported status 'failed'"*

### Forensic Investigation Findings
1. **Root Cause:**
   - In Band Desktop's local daemon (`jamd`), built-in "owned runtimes" (such as `library-plan-author` and `library-code-author`) spawn Claude Code child processes with dynamic stdio MCP configurations (`--mcp-config`).
   - Jamd requires two internal MCP servers:
     - `jam`: provides disposition tools (`jam_reply_to_message`, `jam_no_reply`) to settle inbound room turns.
     - `jam_tasks`: provides Layer-1 task tracking (`TaskCreate`, `TaskUpdate`, `TaskGet`, `TaskList`).
   - If the Claude Code process fails to establish communication with `jam` over stdio during the structural startup probe within the startup window, Claude Code reports:
     ```text
     mcp_servers=[McpServerStatus { name: "jam", status: "failed" }, McpServerStatus { name: "jam_tasks", status: "failed" }]
     ```
   - This triggers Jamd's structural gate error:
     ```text
     ERROR jam_host::claudecode::owned::runtime: owned Claude Code runtime failed its structural startup gate reason=Claude Code could not load Band's disposition MCP relay: jam reported status "failed"
     ```

2. **Independence from ReleaseTrace AI:**
   - ReleaseTrace AI does **NOT** use Jamd's local MCP disposition relay or Claude Code owned child processes.
   - ReleaseTrace AI is a standalone **External Agent** that connects directly to Band Cloud via the official `@band-ai/sdk` over WebSocket.
   - It maintains its own connection, health monitoring, and message lifecycle completely independent of the local Desktop Jam daemon.

---

## 9. Verification & Automated Test Evidence

### Automated Test Suite
Run the test suite:
```bash
npm test -- tests/band-agent/
```

Results:
```text
✓ tests/band-agent/mention.test.ts (8 tests)
✓ tests/band-agent/personality.test.ts (2 tests)
✓ tests/band-agent/config.test.ts (5 tests)
✓ tests/band-agent/adapter.test.ts (5 tests)
✓ tests/band-agent/reasoning.test.ts (11 tests)

Test Files  5 passed (5)
     Tests  31 passed (31)
```

Whole project verification:
```text
Test Files  21 passed (21)
     Tests  101 passed (101)
```

### Live WebSocket Connection Evidence
```text
Testing createReleaseTraceAgent live initialization...
Agent initialized with ID: 88c17522-11f9-4ea7-bcd4-4cd09541c121
Health check: band.configured = true
Connecting to Band WebSocket...
Agent is running: true state: { status: 'running' }
Stopping agent cleanly...
Agent stopped cleanly. Verification SUCCESS.
```

### Live Room V1 Round-Trip Message Verification

**Target Room:** `V1` (`72db800d-4453-4041-8a2e-0a85ae4c4ea2`)
**Agent Participant:** `ReleaseTrace AI` (`88c17522-11f9-4ea7-bcd4-4cd09541c121`)

#### 1. Inbound User Mention (Prompt Success Condition):
```text
2026-11-07T09:58:19.771316Z [text] Amritesh Mishra (User):
@[[88c17522-11f9-4ea7-bcd4-4cd09541c121]] Investigate why this deployment received a HIGH risk assessment.
```

#### 2. ReleaseTrace AI Real-Time Response:
```text
2026-11-07T09:58:22.886038Z [text] ReleaseTrace AI (Agent):
@[[31dd62c0-9d17-4937-aa0f-0b5e3da725a0]] 🔍 **Investigation Report: Deployment `8b2e6194-f78b-45fd-b50b-0d1f81e5c5f2`**
Risk Category: **MEDIUM** | Status: **BUILDING** | Target: **preview**

**1. Verified Current Evidence:**
- Commit: `3addddc4202d6a013f52238ea1a2d5b65590b217` on branch `fix/final-release-polish-and-verification`
- Target Environment: `preview` | Provider: `github_actions`
- Assessment Summary: The git diff introduces 60 file changes, primarily documentation and UI components, plus a new database migration (20261106000000_init).
- Deployment URL: Pending URL assignment

**2. Historical Memory (Hindsight):**
- Status: `ABSTAINED_NO_RELEVANT_MEMORIES`
- Consulted Precedents: 0 record(s)
  * No historical memories were retained or qualified for this deployment.

**3. Deterministic Rule Findings:**
- Rules Evaluated: 8 | Hard Block: NO
- No deterministic safety rule violations detected.

**4. AI-Generated Explanation:**
The assessment flagged this release as **MEDIUM** because: The git diff introduces 60 file changes, primarily documentation and UI components, plus a new database migration (20261106000000_init).

**5. Recommended Next Action:**
- PROCEED
```

#### 3. Inbound Cognitive Abstention Query:
```text
2026-11-07T09:58:45.078676Z [text] Amritesh Mishra (User):
@[[88c17522-11f9-4ea7-bcd4-4cd09541c121]] Explain why the intelligence engine abstained from using historical memory.
```

#### 4. ReleaseTrace AI Architectural Response:
```text
2026-11-07T09:58:46.220969Z [text] ReleaseTrace AI (Agent):
@[[31dd62c0-9d17-4937-aa0f-0b5e3da725a0]] ### 🛑 Abstention Gates & "Never Fabricate Precedent"

A core architectural invariant of ReleaseTrace is **safe cognitive abstention**:

> *"Hindsight memory informs. Current evidence verifies. The engineer decides."*

**Abstention Triggers:**
1. **Empty Memory Bank:** When a new project or service has no historical post-mortems in Hindsight.
2. **Low Semantic Relevance:** When recalled documents have semantic similarity below 0.60.
3. **Environmental Incompatibility:** When recalled incident occurred on an entirely different database engine (e.g. MySQL vs PostgreSQL).
4. **Combined Relevance Threshold:** When the composite score is **< 0.65**.

**What Happens During Abstention:**
- State transitions to `ABSTAINED_NO_RELEVANT_MEMORIES` or `ABSTAINED_LOW_RELEVANCE`.
- Recalled memory list is set to empty `[]`.
- The engine relies solely on verified current evidence and deterministic safety rules.
- ReleaseTrace explains to the user *why* it abstained instead of hallucinating false precedent.
```
