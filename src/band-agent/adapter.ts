/**
 * ReleaseTrace AI Band Agent - Official GenericAdapter Implementation
 */

import {
  GenericAdapter,
  type GenericAdapterHandler,
} from "@band-ai/sdk";
import { isMessageAddressedToAgent, DeduplicationTracker } from "./mention";
import { ReleaseTraceReasoningEngine } from "./reasoning";
import { RELEASE_TRACE_AGENT_NAME } from "./config";

export interface AdapterOptions {
  agentId?: string;
  agentName?: string;
  deduplicationTracker?: DeduplicationTracker;
  reasoningEngine?: ReleaseTraceReasoningEngine;
  onMessageProcessed?: (messageId: string, replyContent: string) => void;
}

/**
 * Creates the GenericAdapter instance for ReleaseTrace AI.
 */
export function createReleaseTraceAdapter(options: AdapterOptions = {}): GenericAdapter {
  const agentName = options.agentName || RELEASE_TRACE_AGENT_NAME;
  const deduplication = options.deduplicationTracker || new DeduplicationTracker();
  const reasoning = options.reasoningEngine || new ReleaseTraceReasoningEngine();

  const handler: GenericAdapterHandler = async ({
    message,
    tools,
    roomId,
    agentName: runtimeAgentName,
  }) => {
    const effectiveAgentName = runtimeAgentName || agentName;
    const agentId = options.agentId || process.env.BAND_AGENT_ID || "";

    // 1. Guard against self-messages to avoid infinite echo loops
    if (
      message.senderId === agentId ||
      (message.senderName && message.senderName === effectiveAgentName)
    ) {
      tools.turn.settle();
      return;
    }

    // 2. Message deduplication check (network retries / SDK startup replay)
    if (deduplication.isDuplicate(message.id)) {
      console.log(`[ReleaseTrace AI] Skipping duplicate message: ${message.id}`);
      tools.turn.settle();
      return;
    }

    // 3. Mention gating
    const mentionCheck = isMessageAddressedToAgent(message, agentId, effectiveAgentName);
    if (!mentionCheck.isMentioned) {
      // Message was not addressed to ReleaseTrace AI; settle the turn cleanly
      tools.turn.settle();
      return;
    }

    // 4. Mark as processed in deduplication tracker
    deduplication.record(message.id);

    console.log(
      `[ReleaseTrace AI] Processing mention in room ${roomId} from ${message.senderName || message.senderId}: "${mentionCheck.cleanedContent.slice(0, 80)}..."`
    );

    // 5. Execute ReleaseTrace reasoning
    try {
      const result = await reasoning.handleMessage(
        mentionCheck.cleanedContent,
        message.senderName
      );

      // Reply mentioning the sender (Band platform requirement: ≥1 mention required)
      const mentions = [{ id: message.senderId }];
      await tools.sendMessage(result.text, mentions);

      if (options.onMessageProcessed) {
        options.onMessageProcessed(message.id, result.text);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[ReleaseTrace AI] Error evaluating message ${message.id}:`, err);

      const failureText = `⚠️ **ReleaseTrace Evaluation Notice:** An error occurred while evaluating your request: ${errMsg}\n\nPer SRE safety invariants: *"Hindsight memory informs. Current evidence verifies. The engineer decides."* No assumptions will be fabricated. Please check service connectivity.`;

      await tools.sendMessage(failureText, [{ id: message.senderId }]);
    }
  };

  return new GenericAdapter(handler);
}
