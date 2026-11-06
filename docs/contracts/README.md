# ReleaseTrace — Shared Frozen Contracts

This directory contains the canonical specifications for all shared data models used across the Platform, Memory Intelligence, and Product Dashboard workstreams.

## Frozen Contract Manifest

| Contract Name | Zod Schema | TypeScript Type | Description |
| :--- | :--- | :--- | :--- |
| **`DeploymentEvidence`** | `DeploymentEvidenceSchema` | `DeploymentEvidence` | Grounded release facts: git commit, branch, test results, build artifacts, Prisma migration checksums. |
| **`DeploymentEvent`** | `DeploymentEventSchema` | `DeploymentEvent` | Normalized ingestion payload received from GitHub Actions or Vercel. |
| **`DeploymentMemoryCase`** | `DeploymentMemoryCaseSchema` | `DeploymentMemoryCase` | The structured historical unit of engineering experience retained in Hindsight. |
| **`MemoryRecallResult`** | `MemoryRecallResultSchema` | `MemoryRecallResult` | Semantic recall output from Hindsight, including bank ID, provenance, memory IDs, and relevance score. |
| **`EnvironmentComparison`** | `EnvironmentComparisonSchema` | `EnvironmentComparison` | Deterministic diff between historical memory environment and current deployment environment. |
| **`RiskFinding`** | `RiskFindingSchema` | `RiskFinding` | Grounded deterministic risk finding citing current evidence and applicable historical memory IDs. |
| **`ReleaseAssessment`** | `ReleaseAssessmentSchema` | `ReleaseAssessment` | Complete assessment output: overall status, findings, environment comparison, Groq LLM explanation, and human actions. |
| **`VerifiedResolution`** | `VerifiedResolutionSchema` | `VerifiedResolution` | Human-confirmed incident outcome required before retention into Hindsight. |

## Contract Governance Rules
1. **Single Source of Truth**: All TypeScript interfaces and Zod runtime validators live in `src/contracts/index.ts`.
2. **Immutability**: No workstream may modify or invent variant types.
3. **Validation**: All boundaries (API routes, webhook ingestion, LLM responses, database records) MUST validate through Zod.
4. **Separation of Evidence vs Memory**: Current deployment facts (`DeploymentEvidence`) must NEVER be confused with historical memory (`DeploymentMemoryCase`).
