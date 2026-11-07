/**
 * HindsightClient Singleton & Server-Side Adapter
 * 
 * Wraps @vectorize-io/hindsight-client with:
 * - Singleton lifecycle management
 * - Resilient connection handling & health checks
 * - In-memory fallback mock mode for offline/test environments
 * - Telemetry on real SDK calls vs mock calls for auditable reporting
 */

import { HindsightClient } from '@vectorize-io/hindsight-client';
import type {
  BankProfileResponse,
  RecallResponse,
  RetainResponse,
  BankConfigResponse,
} from '@vectorize-io/hindsight-client';

export interface HindsightAdapterConfig {
  baseUrl?: string;
  apiKey?: string;
  userAgent?: string;
  maxAttempts?: number;
  useMockTransport?: boolean; // When true, runs in-memory mock for deterministic local testing
}

export interface HindsightHealthStatus {
  isHealthy: boolean;
  apiVersion?: string;
  isMock: boolean;
  features?: Record<string, boolean>;
  error?: string;
}

export interface InMemoryStoredMemory {
  id: string;
  bankId: string;
  content: string;
  context?: string;
  metadata?: Record<string, string>;
  tags: string[];
  timestamp: string;
}

export class HindsightAdapter {
  private static instance: HindsightAdapter | null = null;
  private client: HindsightClient;
  private config: HindsightAdapterConfig;
  private isMockMode: boolean;

  // In-memory mock store for tests / offline operation
  private mockBanks: Map<string, Record<string, unknown>> = new Map();
  private mockMemories: Map<string, InMemoryStoredMemory[]> = new Map();

  // Audit trackers
  private realSdkCalls: Set<string> = new Set();
  private mockedCalls: Set<string> = new Set();

  private constructor(config: HindsightAdapterConfig = {}) {
    const apiKey = config.apiKey || process.env.HINDSIGHT_API_KEY;
    this.config = {
      baseUrl: config.baseUrl || process.env.HINDSIGHT_BASE_URL || process.env.HINDSIGHT_API_URL || 'https://api.hindsight.vectorize.io',
      apiKey,
      userAgent: config.userAgent || 'releasetrace-engine/1.0.0',
      maxAttempts: config.maxAttempts || 3,
      useMockTransport: config.useMockTransport ?? (process.env.HINDSIGHT_USE_MOCK === 'true' || !apiKey || process.env.NODE_ENV === 'test'),
    };

    this.isMockMode = Boolean(this.config.useMockTransport);

    this.client = new HindsightClient({
      baseUrl: this.config.baseUrl!,
      apiKey: this.config.apiKey,
      userAgent: this.config.userAgent,
      maxAttempts: this.config.maxAttempts,
    });
  }

  public static getInstance(config?: HindsightAdapterConfig): HindsightAdapter {
    if (!HindsightAdapter.instance) {
      HindsightAdapter.instance = new HindsightAdapter(config);
    }
    return HindsightAdapter.instance;
  }

  public static resetInstance(): void {
    HindsightAdapter.instance = null;
  }

  public getRawClient(): HindsightClient {
    return this.client;
  }

  public isMock(): boolean {
    return this.isMockMode;
  }

  public setMockMode(enabled: boolean): void {
    this.isMockMode = enabled;
  }

  public getAuditedCalls(): { realCalls: string[]; mockedCalls: string[] } {
    return {
      realCalls: Array.from(this.realSdkCalls),
      mockedCalls: Array.from(this.mockedCalls),
    };
  }

  /**
   * Health Check: queries Hindsight getVersion()
   */
  public async checkHealth(): Promise<HindsightHealthStatus> {
    if (this.isMockMode) {
      this.mockedCalls.add('checkHealth');
      return {
        isHealthy: true,
        apiVersion: '1.2.0-inmemory-mock',
        isMock: true,
        features: { text_search: true, observations: true, graph: true, temporal: true },
      };
    }

    try {
      this.realSdkCalls.add('getVersion');
      const version = await this.client.getVersion();
      return {
        isHealthy: true,
        apiVersion: version.api_version,
        isMock: false,
        features: version.features as Record<string, boolean>,
      };
    } catch (err) {
      return {
        isHealthy: false,
        isMock: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /**
   * Create or update a project memory bank
   */
  public async createBank(
    bankId: string,
    options: {
      name?: string;
      reflectMission?: string;
      retainMission?: string;
      retainExtractionMode?: string;
      enableObservations?: boolean;
      enableTextSearch?: boolean;
      enableTemporalRetrieval?: boolean;
      enableGraphRetrieval?: boolean;
      enableReranking?: boolean;
    }
  ): Promise<BankProfileResponse> {
    if (this.isMockMode) {
      this.mockedCalls.add('createBank');
      this.mockBanks.set(bankId, { id: bankId, ...options });
      if (!this.mockMemories.has(bankId)) {
        this.mockMemories.set(bankId, []);
      }
      return {
        bank_id: bankId,
        name: options.name || bankId,
        reflect_mission: options.reflectMission,
        retain_mission: options.retainMission,
      } as unknown as BankProfileResponse;
    }

    this.realSdkCalls.add('createBank');
    return await this.client.createBank(bankId, options);
  }

  /**
   * Get bank configuration
   */
  public async getBankConfig(bankId: string): Promise<BankConfigResponse> {
    if (this.isMockMode) {
      this.mockedCalls.add('getBankConfig');
      const bank = this.mockBanks.get(bankId) || {};
      return {
        bank_id: bankId,
        ...bank,
      } as BankConfigResponse;
    }

    this.realSdkCalls.add('getBankConfig');
    return await this.client.getBankConfig(bankId);
  }

  /**
   * Retain a memory
   */
  public async retain(
    bankId: string,
    content: string,
    options?: {
      timestamp?: string | Date;
      context?: string;
      metadata?: Record<string, string>;
      document_id?: string;
      tags?: string[];
    }
  ): Promise<RetainResponse> {
    if (this.isMockMode) {
      this.mockedCalls.add('retain');
      if (!this.mockMemories.has(bankId)) {
        this.mockMemories.set(bankId, []);
      }

      const list = this.mockMemories.get(bankId)!;
      const docId = options?.document_id || `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      // Idempotency: replace if document_id already exists
      const existingIdx = list.findIndex(m => m.id === docId);
      const record: InMemoryStoredMemory = {
        id: docId,
        bankId,
        content,
        context: options?.context,
        metadata: options?.metadata,
        tags: options?.tags || [],
        timestamp: options?.timestamp instanceof Date ? options.timestamp.toISOString() : (options?.timestamp || new Date().toISOString()),
      };

      if (existingIdx >= 0) {
        list[existingIdx] = record;
      } else {
        list.push(record);
      }

      return {
        success: true,
        bank_id: bankId,
        items_count: 1,
        async: false,
      };
    }

    this.realSdkCalls.add('retain');
    return await this.client.retain(bankId, content, options);
  }

  /**
   * Recall memories
   */
  public async recall(
    bankId: string,
    query: string,
    options?: {
      tags?: string[];
      tagsMatch?: 'any' | 'all' | 'any_strict' | 'all_strict' | 'exact';
      budget?: 'low' | 'mid' | 'high';
      maxTokens?: number;
      minScores?: { semantic?: number; final?: number };
    }
  ): Promise<RecallResponse> {
    if (this.isMockMode) {
      this.mockedCalls.add('recall');
      const list = this.mockMemories.get(bankId) || [];

      // Keyword & tag matching in mock store
      const queryTerms = query.toLowerCase().split(/\s+/).filter(Boolean);

      const scored = list.map(mem => {
        let matchCount = 0;
        const textLower = `${mem.content} ${mem.context || ''}`.toLowerCase();
        for (const term of queryTerms) {
          if (textLower.includes(term)) matchCount++;
        }

        // Tag matching bonus
        let tagMatchBonus = 0;
        if (options?.tags && options.tags.length > 0) {
          const matchedTags = options.tags.filter(t => mem.tags.includes(t));
          if (matchedTags.length > 0) {
            tagMatchBonus = matchedTags.length / options.tags.length * 0.3;
          }
        }

        const semanticScore = queryTerms.length > 0 ? (matchCount / queryTerms.length) * 0.7 + tagMatchBonus : 0.5;
        const finalScore = Math.min(1.0, semanticScore);

        return {
          id: mem.id,
          text: mem.content,
          context: mem.context,
          metadata: mem.metadata,
          tags: mem.tags,
          scores: {
            final: Math.round(finalScore * 100) / 100,
            semantic: Math.round(semanticScore * 100) / 100,
          },
        };
      });

      // Filter by minScores if provided
      let results = scored;
      if (options?.minScores?.final !== undefined) {
        results = results.filter(r => (r.scores.final ?? 0) >= options.minScores!.final!);
      }

      // Sort descending by final score
      results.sort((a, b) => (b.scores.final ?? 0) - (a.scores.final ?? 0));

      return {
        results: results as any,
      };
    }

    this.realSdkCalls.add('recall');
    return await this.client.recall(bankId, query, options);
  }

  /**
   * Helper: get total count of memories in a bank
   */
  public getBankMemoriesCount(bankId: string): number {
    return (this.mockMemories.get(bankId) || []).length;
  }

  /**
   * Helper: retrieve in-memory stored memories for a bank
   */
  public getMockMemories(bankId: string): InMemoryStoredMemory[] {
    return this.mockMemories.get(bankId) || [];
  }

  /**
   * Helper for tests: clear mock storage for a bank
   */
  public clearMockBank(bankId: string): void {
    this.mockMemories.delete(bankId);
    this.mockBanks.delete(bankId);
  }
}
