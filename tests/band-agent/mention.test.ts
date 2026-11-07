import { describe, it, expect, beforeEach } from "vitest";
import { isMessageAddressedToAgent, DeduplicationTracker } from "@/band-agent/mention";
import type { PlatformMessage } from "@band-ai/sdk";

describe("Band Agent: Mention Detection", () => {
  const agentId = "88c17522-11f9-4ea7-bcd4-4cd09541c121";
  const agentName = "ReleaseTrace AI";

  function createMockMessage(overrides: Partial<PlatformMessage> = {}): PlatformMessage {
    return {
      id: "msg-" + Math.random().toString(36).slice(2),
      roomId: "room-v1",
      content: "Hello",
      senderId: "user-123",
      senderType: "User",
      senderName: "Amritesh Mishra",
      messageType: "text",
      metadata: {},
      createdAt: new Date(),
      ...overrides,
    };
  }

  it("detects mention when agentId is in metadata.mentions", () => {
    const msg = createMockMessage({
      content: "Can you investigate this release?",
      metadata: {
        mentions: [{ id: agentId, name: agentName, handle: "releasetrace-ai" }],
      },
    });

    const result = isMessageAddressedToAgent(msg, agentId, agentName);
    expect(result.isMentioned).toBe(true);
    expect(result.mentionedBy.id).toBe("user-123");
  });

  it("detects mention when @ReleaseTrace AI is in text content", () => {
    const msg = createMockMessage({
      content: "@ReleaseTrace AI Why did this deployment receive a HIGH risk assessment?",
      metadata: {},
    });

    const result = isMessageAddressedToAgent(msg, agentId, agentName);
    expect(result.isMentioned).toBe(true);
    expect(result.cleanedContent).toContain("Why did this deployment receive a HIGH risk assessment?");
    expect(result.cleanedContent).not.toContain("@ReleaseTrace AI");
  });

  it("detects case-insensitive variants like @releasetrace", () => {
    const msg = createMockMessage({
      content: "@releasetrace explain deterministic rules",
      metadata: {},
    });

    const result = isMessageAddressedToAgent(msg, agentId, agentName);
    expect(result.isMentioned).toBe(true);
    expect(result.cleanedContent).toBe("explain deterministic rules");
  });

  it("detects internal Band platform mention tokens", () => {
    const msg = createMockMessage({
      content: `@[[${agentId}]] Check deployment status`,
      metadata: {},
    });

    const result = isMessageAddressedToAgent(msg, agentId, agentName);
    expect(result.isMentioned).toBe(true);
    expect(result.cleanedContent).toBe("Check deployment status");
  });

  it("returns isMentioned: false when addressed to another agent", () => {
    const msg = createMockMessage({
      content: "@CodeReviewer Please review this diff",
      metadata: {
        mentions: [{ id: "code-reviewer-id", name: "Code Reviewer" }],
      },
    });

    const result = isMessageAddressedToAgent(msg, agentId, agentName);
    expect(result.isMentioned).toBe(false);
  });
});

describe("Band Agent: DeduplicationTracker", () => {
  let tracker: DeduplicationTracker;

  beforeEach(() => {
    tracker = new DeduplicationTracker(1000, 5); // 1s TTL, max 5 entries
  });

  it("identifies new messages as non-duplicates and records them", () => {
    expect(tracker.isDuplicate("msg-1")).toBe(false);
    tracker.record("msg-1");
    expect(tracker.isDuplicate("msg-1")).toBe(true);
  });

  it("respects maximum capacity by evicting oldest", () => {
    tracker.record("m1");
    tracker.record("m2");
    tracker.record("m3");
    tracker.record("m4");
    tracker.record("m5");
    tracker.record("m6"); // should evict m1

    expect(tracker.isDuplicate("m1")).toBe(false);
    expect(tracker.isDuplicate("m6")).toBe(true);
  });

  it("clears entries cleanly", () => {
    tracker.record("m1");
    tracker.clear();
    expect(tracker.isDuplicate("m1")).toBe(false);
  });
});
