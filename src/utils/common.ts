import type {
  AgentMessage,
  MessageContent,
  SessionEntryType,
  SessionMessageEntry,
  TextContent,
} from "../types.js";

export const toAgentMessage = (entry: SessionMessageEntry): AgentMessage => {
  switch (entry.role) {
    case "user":
      return {
        role: "user",
        content: entry.content as TextContent[],
        timestamp: entry.timestamp ?? Date.now(),
      };

    case "assistant":
      return {
        role: "assistant",
        content: entry.content as MessageContent[],
      };

    case "toolResult":
      return {
        role: "toolResult",
        toolCallId: entry.toolCallId ?? "",
        toolName: entry.toolName ?? "",
        content: entry.content as string[],
        isError: entry.isError ?? false,
        timestamp: entry.timestamp ?? Date.now(),
      };
  }
};

export const toSessionMessageEntry = (
  message: AgentMessage,
  type?: SessionEntryType,
  lastCompactedMessageId?: string,
): SessionMessageEntry => {
  let entry: SessionMessageEntry = {
    type: type ?? "message",
    id: crypto.randomUUID(),
    ...message,
  };
  if (lastCompactedMessageId) {
    entry.lastCompactedMessageId = lastCompactedMessageId;
  }
  return entry;
};
