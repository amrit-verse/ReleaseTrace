# Architecture Decision Log (ADR)

## ADR 001: Next.js 15 App Router & TypeScript Stack
- **Status**: Accepted
- **Context**: High-performance dashboard and API route handlers needed for deployment observability.
- **Decision**: Standardize on Next.js 15 with App Router, server-only route handlers for integration clients, Tailwind CSS, and strict TypeScript.
- **Consequences**: Fast server-side rendering, robust route security, seamless integration with Vercel deployment targets.

## ADR 002: Hindsight Cloud by Vectorize for Semantic Memory
- **Status**: Accepted
- **Context**: Release intelligence requires persistent historical engineering memory across deployments rather than ephemeral context windows.
- **Decision**: Use the official `@vectorize-io/hindsight-client` (v1.2.0) connecting to Hindsight Cloud.
- **Rules**:
  - Exactly one isolated memory bank per connected project (`bankId = proj_<projectId>_bank`).
  - Strict human gate: Only verified engineering resolutions are retained (`DeploymentMemoryCase`).
  - Empty-memory abstention: System explicitly states when memory is empty and executes baseline rules.
  - Provenance: All memory citations must link to original memory ID, bank ID, and timestamp.

## ADR 003: Neon PostgreSQL + Prisma with Serverless Neon Driver
- **Status**: Accepted
- **Context**: Serverless Next.js Route Handlers and Inngest jobs require connection pooling and reliable relational constraints.
- **Decision**: Utilize Neon PostgreSQL with `@prisma/adapter-neon` and `@neondatabase/serverless` for pooled application queries, with direct connection configured for Prisma schema migrations.
- **Rules**: Idempotency keys on all webhook events; unique deployment identifiers; explicit foreign keys for audit trails. Never store plaintext secrets.

## ADR 004: Inngest for Asynchronous Workflow Durability
- **Status**: Accepted
- **Context**: Long-running LLM and memory recall operations cannot block synchronous webhook ingestion endpoints.
- **Decision**: Ingest webhook responds with 202 Accepted immediately upon HMAC verification and delegates processing to Inngest durable steps (`inngest/deployment-assessment`).
- **Consequences**: Built-in automatic retries, step memoization, and complete failure recovery.

## ADR 005: Groq Provider with Fallback & Strict Zod Validation
- **Status**: Accepted
- **Context**: Fast LLM inferences needed for risk synthesis.
- **Decision**: Integrate `groq-sdk` with configurable models (`openai/gpt-oss-120b`, `qwen/qwen3-32b`, or `llama-3.3-70b-versatile`).
- **Safety**: All LLM outputs must validate against Zod schemas; if malformed or provider times out, fallback to deterministic rule synthesis. The application never crashes on LLM failure.

## ADR 006: HMAC-SHA256 Signed Ingestion with Timestamp Anti-Replay
- **Status**: Accepted
- **Context**: Prevent untrusted or spoofed deployment events.
- **Decision**: Verify `X-ReleaseTrace-Signature` (`sha256=<hmac>`) computed over the raw request payload with `X-ReleaseTrace-Timestamp` strictly within 300 seconds.
