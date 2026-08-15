import {
  SUMMARIZATION_SYSTEM_PROMPT,
  serializeConversation,
  splitForCompaction,
} from "./utils.js";
import type {
  AgentMessage,
  CompactionResult,
  Provider,
  SessionMessageEntry,
} from "../types.js";
import { toAgentMessage, toSessionMessageEntry } from "../utils/common.js";

export async function compact(
  messages: SessionMessageEntry[],
  provider: Provider,
  model: string,
): Promise<CompactionResult> {
  const { messagesToCompact, recentMessages } = splitForCompaction(messages);
  const summaryPrompt = serializeConversation(
    messagesToCompact.map(toAgentMessage),
  ).trim();

  const response = await provider.chat({
    model,
    systemPrompt: SUMMARIZATION_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: summaryPrompt || "Summarize the prior conversation state.",
          },
        ],
        timestamp: Date.now(),
      },
    ],
    tools: [],
  });

  const summary =
    response?.content?.text?.trim() ||
    summaryPrompt ||
    "No prior context retained.";

  const lastCompactedMessageId =
    messagesToCompact[messagesToCompact.length - 1]?.id!;

  const summaryMessage: SessionMessageEntry = toSessionMessageEntry(
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `Context summary:\n${summary}`,
        },
      ],
      timestamp: Date.now(),
    },
    "compaction",
    lastCompactedMessageId,
  );

  return {
    compactionEntry: summaryMessage,
    updatedMessages: [summaryMessage, ...recentMessages],
  };
}
