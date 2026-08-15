import type {
  AgentMessage,
  SessionEntryType,
  SessionMessageEntry,
} from "../types.js";

export const toAgentMessage = (entry: SessionMessageEntry): AgentMessage => {
  const { type: _type, id: _id, ...message } = entry;
  return message as AgentMessage;
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
