import {
  SUMMARIZATION_SYSTEM_PROMPT,
  serializeConversation,
  splitForCompaction,
} from "./utils.js";
import type { AgentMessage, CompactionResult, Provider } from "../types.js";

export async function compact(
  messages: AgentMessage[],
  provider: Provider,
  model: string,
): Promise<CompactionResult> {
  const { messagesToCompact, recentMessages } = splitForCompaction(messages);
  const summaryPrompt = serializeConversation(messagesToCompact).trim();

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

  const summaryMessage: AgentMessage = {
    role: "user",
    content: [
      {
        type: "text",
        text: `Context summary:\n${summary}`,
      },
    ],
    timestamp: Date.now(),
  };

  return {
    compactionEntry: summaryMessage,
    updatedMessages: [summaryMessage, ...recentMessages],
  };
}