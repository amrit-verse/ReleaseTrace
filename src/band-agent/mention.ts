/**
 * ReleaseTrace AI Band Agent - Mention Detection & Message Deduplication
 */

import type { PlatformMessage } from "@band-ai/sdk";
import type { MentionCheckResult } from "./types";

export class DeduplicationTracker {
  private readonly processedIds = new Map<string, number>();
  private readonly ttlMs: number;
  private readonly maxEntries: number;

  constructor(ttlMs = 10 * 60 * 1000, maxEntries = 1000) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
  }

  public isDuplicate(messageId: string): boolean {
    this.evictExpired();
    return this.processedIds.has(messageId);
  }

  public record(messageId: string): void {
    this.evictExpired();
    if (this.processedIds.size >= this.maxEntries) {
      const oldestKey = this.processedIds.keys().next().value;
      if (oldestKey) this.processedIds.delete(oldestKey);
    }
    this.processedIds.set(messageId, Date.now());
  }

  public clear(): void {
    this.processedIds.clear();
  }

  public size(): number {
    this.evictExpired();
    return this.processedIds.size;
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [id, timestamp] of this.processedIds.entries()) {
      if (now - timestamp > this.ttlMs) {
        this.processedIds.delete(id);
      }
    }
  }
}

/**
 * Checks whether an incoming Band message mentions or addresses ReleaseTrace AI.
 */
export function isMessageAddressedToAgent(
  message: PlatformMessage,
  agentId: string,
  agentName = "ReleaseTrace AI"
): MentionCheckResult {
  const content = message.content || "";
  const metadata = (message.metadata || {}) as Record<string, unknown>;
  const rawMentions = Array.isArray(metadata.mentions) ? metadata.mentions : [];

  // 1. Check structured metadata mentions
  let mentionedInMetadata = false;
  for (const m of rawMentions) {
    if (!m || typeof m !== "object") continue;
    const mentionObj = m as Record<string, unknown>;
    const mId = String(mentionObj.id || "");
    const mName = String(mentionObj.name || "").toLowerCase();
    const mHandle = String(mentionObj.handle || "").toLowerCase();

    if (
      mId === agentId ||
      mName === agentName.toLowerCase() ||
      mName.includes("releasetrace") ||
      mHandle.includes("releasetrace")
    ) {
      mentionedInMetadata = true;
      break;
    }
  }

  // 2. Check text content for explicit mention tokens or names
  const normalizedContent = content.toLowerCase();
  const nameVariants = [
    `@${agentName.toLowerCase()}`,
    `@releasetrace ai`,
    `@releasetrace-ai`,
    `@releasetrace`,
    `releasetrace ai:`,
    `releasetrace:`,
  ];

  const mentionedInContent = nameVariants.some((variant) =>
    normalizedContent.includes(variant)
  );

  // 3. Check for Band's internal mention tokens: @[[agentId]] or @[[agentName]]
  const tokenPattern = new RegExp(`@\\[\\[.*?(?:${agentId}|releasetrace).*?\\]\\]`, "i");
  const mentionedByToken = tokenPattern.test(content);

  const isMentioned = mentionedInMetadata || mentionedInContent || mentionedByToken;

  // Clean the content by removing the leading mention
  let cleanedContent = content;
  for (const variant of [
    `@${agentName}`,
    `@${agentName.toLowerCase()}`,
    `@ReleaseTrace AI`,
    `@releasetrace ai`,
    `@releasetrace-ai`,
    `@releasetrace`,
    `@ReleaseTrace`,
  ]) {
    cleanedContent = cleanedContent.replace(new RegExp(variant, "gi"), "");
  }
  // Also strip tokens like @[[...]]
  cleanedContent = cleanedContent.replace(/@\[\[.*?\]\]/g, "");
  cleanedContent = cleanedContent.trim();

  return {
    isMentioned,
    isDirectMessage: isMentioned,
    cleanedContent: cleanedContent || content,
    mentionedBy: {
      id: message.senderId,
      name: message.senderName,
      type: message.senderType,
    },
  };
}
