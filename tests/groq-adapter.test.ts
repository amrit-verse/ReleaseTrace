import { describe, it, expect } from 'vitest';
import { GroqAdapter } from '../src/intelligence/llm/groq-adapter';

describe('Groq LLM Adapter & Zod Output Validation', () => {
  it('parses and validates well-formed JSON output against Zod schema', () => {
    const adapter = new GroqAdapter({ useMockTransport: true });

    const rawJson = JSON.stringify({
      summary: 'Evaluation completed successfully with verified historical experience.',
      overallRisk: 'HIGH',
      confidence: 'HIGH',
      abstentionState: 'ACCUMULATED_EXPERIENCE',
      recalledMemoriesUsed: [
        {
          memoryId: 'case-001',
          confirmedRootCause: 'Connection starvation',
          verifiedMitigation: 'Add lock_timeout',
          historicalConditions: 'nodejs@20, postgresql v14',
          relevanceScore: 0.88,
          environmentMatchScore: 0.95,
          confirmedBy: 'sarah@corp.com',
          confirmedAt: '2026-11-01T12:00:00Z',
        },
      ],
      currentEvidenceObservations: ['Migration detected'],
      recommendations: [
        {
          action: 'Apply lock_timeout',
          priority: 'PRE_DEPLOY',
          rationale: 'Prevent table-level starvation during migration.',
          source: 'VERIFIED_MEMORY',
          memoryReference: {
            memoryId: 'case-001',
            confirmedBy: 'sarah@corp.com',
            confirmedAt: '2026-11-01T12:00:00Z',
          },
        },
      ],
    });

    const parsed = adapter.parseAndValidate(rawJson);
    expect(parsed.overallRisk).toBe('HIGH');
    expect(parsed.recalledMemoriesUsed.length).toBe(1);
    expect(parsed.recommendations[0].source).toBe('VERIFIED_MEMORY');
  });

  it('strips markdown ```json wrapper before validating', () => {
    const adapter = new GroqAdapter({ useMockTransport: true });

    const wrappedMarkdown = `\`\`\`json
{
  "summary": "Valid assessment wrapped in markdown code fence.",
  "overallRisk": "LOW",
  "confidence": "MEDIUM",
  "abstentionState": "ABSTAINED_NO_RELEVANT_MEMORIES",
  "abstentionReason": "Empty memory bank",
  "recalledMemoriesUsed": [],
  "currentEvidenceObservations": ["No migration found"],
  "recommendations": [
    {
      "action": "Proceed with canary deployment",
      "priority": "PRE_DEPLOY",
      "rationale": "No risks detected in current evidence.",
      "source": "CURRENT_EVIDENCE_ANALYSIS"
    }
  ]
}
\`\`\``;

    const parsed = adapter.parseAndValidate(wrappedMarkdown);
    expect(parsed.overallRisk).toBe('LOW');
    expect(parsed.abstentionState).toBe('ABSTAINED_NO_RELEVANT_MEMORIES');
  });

  it('throws error when JSON violates Zod schema (e.g. invalid risk enum)', () => {
    const adapter = new GroqAdapter({ useMockTransport: true });

    const invalidEnumJson = JSON.stringify({
      summary: 'Short summary',
      overallRisk: 'DANGEROUS', // Not in ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']!
      confidence: 'HIGH',
      abstentionState: 'ACCUMULATED_EXPERIENCE',
      recommendations: [],
    });

    expect(() => adapter.parseAndValidate(invalidEnumJson)).toThrow('LLM output failed Zod schema validation');
  });
});
