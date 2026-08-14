import {
  SUMMARIZATION_SYSTEM_PROMPT,
  serializeConversation,
} from "./utils.js";
import type { AgentMessage, Provider } from "../types.js";

export type CompactionResult = {
  summary: string;
  recentMessages: AgentMessage[];
  compactedMessages: AgentMessage[];
};

export async function compact(
  messages: AgentMessage[],
  provider: Provider,
  model: string,
  keepRecent = 20,
): Promise<CompactionResult> {
  if (messages.length <= keepRecent) {
    return {
      summary: "",
      recentMessages: messages,
      compactedMessages: messages,
    };
  }

  const recentMessages = messages.slice(-keepRecent);
  const oldMessages = messages.slice(0, -keepRecent);
  const summaryPrompt = serializeConversation(oldMessages).trim();

  const response = await provider.chat({
    model,
    systemPrompt: SUMMARIZATION_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [{ type: "text", text: summaryPrompt || "Summarize the prior conversation state." }],
        timestamp: Date.now(),
      },
    ],
    tools: [],
  });

  const summary = response?.content?.text?.trim() || summaryPrompt || "No prior context retained.";

  const compactedMessages: AgentMessage[] = [
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
    ...recentMessages,
  ];

  return {
    summary,
    recentMessages,
    compactedMessages,
  };
}