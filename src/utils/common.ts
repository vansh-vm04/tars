import path from "node:path";
import type {
  AgentMessage,
  MessageContent,
  SessionEntryType,
  SessionMessageEntry,
  TextContent,
} from "../types.js";

 // Normalize a filesystem path for reliable comparison.
export const normalizePath = (p: string): string => {
  let resolved = path.resolve(p);
  if (resolved.length > 1 && resolved.endsWith(path.sep)) {
    resolved = resolved.slice(0, -1);
  }
  // Handle alternate separator on Windows (both / and \ can appear before resolve)
  if (process.platform === "win32") {
    return resolved.toLowerCase();
  }
  return resolved;
};

export const arePathsEqual = (a: string, b: string): boolean =>
  normalizePath(a) === normalizePath(b);

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
