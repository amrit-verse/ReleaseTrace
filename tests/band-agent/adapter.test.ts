import { describe, it, expect, beforeEach } from "vitest";
import { createReleaseTraceAdapter } from "@/band-agent/adapter";
import { DeduplicationTracker } from "@/band-agent/mention";
import { FakeAgentTools } from "@band-ai/sdk/testing";
import type { PlatformMessage } from "@band-ai/sdk";

describe("Band Agent: GenericAdapter Turn Handling", () => {
  const agentId = "88c17522-11f9-4ea7-bcd4-4cd09541c121";
  const agentName = "ReleaseTrace AI";
  let deduplicationTracker: DeduplicationTracker;

  beforeEach(() => {
    deduplicationTracker = new DeduplicationTracker();
  });

  function createMockMessage(overrides: Partial<PlatformMessage> = {}): PlatformMessage {
    return {
      id: "msg-" + Math.random().toString(36).slice(2),
      roomId: "room-v1-test",
      content: "Hello",
      senderId: "user-456",
      senderType: "User",
      senderName: "Amritesh Mishra",
      messageType: "text",
      metadata: {},
      createdAt: new Date(),
      ...overrides,
    };
  }

  function createMockHistory() {
    return {
      raw: [],
      length: 0,
      convert: <T>(converter: { convert: (raw: unknown[]) => T }): T => converter.convert([]),
    };
  }

  it("settles the turn cleanly without sending a message when agent is NOT mentioned", async () => {
    const adapter = createReleaseTraceAdapter({
      agentId,
      agentName,
      deduplicationTracker,
    });

    const fakeTools = new FakeAgentTools();
    const history = createMockHistory();
    const unmentionedMessage = createMockMessage({
      content: "@CodeReviewer please review this code",
      metadata: { mentions: [{ id: "other-agent-id", name: "Code Reviewer" }] },
    });

    await adapter.onMessage(
      unmentionedMessage,
      fakeTools as any,
      history as any,
      null,
      null,
      { isSessionBootstrap: false, roomId: "room-v1-test" }
    );

    expect(fakeTools.messagesSent.length).toBe(0);
    expect(fakeTools.turn.replied).toBe(false);
  });

  it("settles turn without replying when message is sent by the agent itself", async () => {
    const adapter = createReleaseTraceAdapter({
      agentId,
      agentName,
      deduplicationTracker,
    });

    const fakeTools = new FakeAgentTools();
    const history = createMockHistory();
    const selfMessage = createMockMessage({
      senderId: agentId,
      senderName: agentName,
      content: "Automated report",
    });

    await adapter.onMessage(
      selfMessage,
      fakeTools as any,
      history as any,
      null,
      null,
      { isSessionBootstrap: false, roomId: "room-v1-test" }
    );

    expect(fakeTools.messagesSent.length).toBe(0);
  });

  it("settles turn without replying when message ID is a duplicate", async () => {
    const adapter = createReleaseTraceAdapter({
      agentId,
      agentName,
      deduplicationTracker,
    });

    const fakeTools = new FakeAgentTools();
    const history = createMockHistory();
    const messageId = "duplicate-msg-id-123";

    // Mark as previously processed
    deduplicationTracker.record(messageId);

    const dupMessage = createMockMessage({
      id: messageId,
      content: `@ReleaseTrace AI Explain architecture`,
    });

    await adapter.onMessage(
      dupMessage,
      fakeTools as any,
      history as any,
      null,
      null,
      { isSessionBootstrap: false, roomId: "room-v1-test" }
    );

    expect(fakeTools.messagesSent.length).toBe(0);
  });

  it("processes mention, invokes reasoning, and replies with required sender mention", async () => {
    let processedId: string | null = null;
    const adapter = createReleaseTraceAdapter({
      agentId,
      agentName,
      deduplicationTracker,
      onMessageProcessed: (id) => {
        processedId = id;
      },
    });

    const fakeTools = new FakeAgentTools();
    const history = createMockHistory();
    const validMentionMessage = createMockMessage({
      id: "mention-msg-001",
      senderId: "engineer-amritesh",
      senderName: "Amritesh Mishra",
      content: "@ReleaseTrace AI Explain architecture",
    });

    await adapter.onMessage(
      validMentionMessage,
      fakeTools as any,
      history as any,
      null,
      null,
      { isSessionBootstrap: false, roomId: "room-v1-test" }
    );

    expect(processedId).toBe("mention-msg-001");
    expect(fakeTools.messagesSent.length).toBe(1);

    const sent = fakeTools.messagesSent[0];
    expect(sent.content).toContain("ReleaseTrace Architecture Overview");
    // Verify recipient mention requirement (Band platform 422 safeguard)
    expect(sent.mentions).toEqual([{ id: "engineer-amritesh" }]);
    expect(deduplicationTracker.isDuplicate("mention-msg-001")).toBe(true);
  });

  it("handles internal reasoning failure gracefully without crashing and replies with SRE notice", async () => {
    const mockFaultyReasoning = {
      handleMessage: async () => {
        throw new Error("Neon database connection pool timeout");
      },
    } as any;

    const adapter = createReleaseTraceAdapter({
      agentId,
      agentName,
      deduplicationTracker,
      reasoningEngine: mockFaultyReasoning,
    });

    const fakeTools = new FakeAgentTools();
    const history = createMockHistory();
    const message = createMockMessage({
      id: "faulty-msg-002",
      senderId: "user-789",
      content: "@ReleaseTrace AI Investigate",
    });

    await adapter.onMessage(
      message,
      fakeTools as any,
      history as any,
      null,
      null,
      { isSessionBootstrap: false, roomId: "room-v1-test" }
    );

    expect(fakeTools.messagesSent.length).toBe(1);
    const sent = fakeTools.messagesSent[0];
    expect(sent.content).toContain("ReleaseTrace Evaluation Notice");
    expect(sent.content).toContain("Neon database connection pool timeout");
    expect(sent.content).toContain("Hindsight memory informs. Current evidence verifies. The engineer decides.");
    expect(sent.mentions).toEqual([{ id: "user-789" }]);
  });
});
