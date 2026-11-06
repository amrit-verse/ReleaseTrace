# ReleaseTrace — Team Workflow & Workstream Protocol

## 1. Workstream Assignments & Branching Model

To coordinate parallel engineering without merge collisions, the repository enforces strict module ownership across three workstreams:

```
main (Protected trunk)
  │
  ├── integration/architecture-contracts (Lead: Frozen types & DB schema)
  │     │
  │     ├── feat/platform-integration   (Workstream 1: Ingestion, Vercel, Inngest, DB)
  │     ├── feat/memory-intelligence    (Workstream 2: Hindsight, Groq, Risk Engine)
  │     └── feat/product-dashboard      (Workstream 3: Next.js UI, Rehearsal Lab, Explorer)
  │
  └── integration/releasetrace-mvp     (Staging integration branch)
```

---

## 2. Workstream Module Ownership

### Workstream 1: Platform Integration (`feat/platform-integration`)
- **Owner**: Platform Engineer
- **Responsibilities**:
  - Webhook route handler (`src/app/api/webhooks/deployments/route.ts`)
  - Signed HMAC SHA-256 validator (`src/lib/security/signature.ts`)
  - Vercel API client & commit-sha correlator (`src/lib/vercel/index.ts`)
  - Inngest background handler & step definitions (`src/lib/inngest/index.ts`)
  - Prisma database schema, migrations, and Neon adapter client (`prisma/schema.prisma`, `src/lib/db/client.ts`)
- **Owned Tests**: `tests/platform/*.test.ts`

### Workstream 2: Memory Intelligence (`feat/memory-intelligence`)
- **Owner**: Memory / AI Engineer
- **Responsibilities**:
  - Hindsight client adapter (`src/lib/hindsight/client.ts`)
  - Project memory bank management & profile initialization
  - Empty-memory abstention logic & contradiction detection
  - Environment comparison engine (`src/lib/memory/environment-diff.ts`)
  - Deterministic Risk Engine (`src/lib/risk-engine/index.ts`)
  - Groq LLM grounded synthesis with Zod fallback (`src/lib/groq/index.ts`)
  - Verified human retention pipeline (`src/lib/memory/retention.ts`)
- **Owned Tests**: `tests/memory/*.test.ts`, `tests/risk-engine/*.test.ts`

### Workstream 3: Product Dashboard (`feat/product-dashboard`)
- **Owner**: Frontend / Product Engineer
- **Responsibilities**:
  - ReleaseTrace Dashboard (`src/app/page.tsx`, `src/app/deployments/page.tsx`)
  - Deployment Assessment Detail view (`src/app/deployments/[id]/page.tsx`)
  - Recalled Memory Explorer with Provenance viewer (`src/app/memory/page.tsx`)
  - Interactive Learning Lab for before/after rehearsal (`src/app/learning-lab/page.tsx`)
  - Human Engineer Verification Form (`src/components/assessment/VerifyResolutionModal.tsx`)
- **Owned Tests**: `tests/ui/*.test.ts`

---

## 3. Communication & Code Quality Rules
1. **Never edit another workstream's owned modules** without coordination.
2. **All workstreams import from `src/contracts/index.ts`**. No ad-hoc data structures.
3. Every PR must pass `npm run test` and `npm run build` before merge.
4. Always redact sensitive keys, tokens, and database credentials.
