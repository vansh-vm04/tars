import { compact } from "./compaction/compaction.js";
import type { AgentMessage, Provider } from "./types.js";

export class ContextManager {
  constructor(
    private readonly contextWindow: number,
    private readonly compactionThreshold = 0.7,
  ) {}

  shouldCompact(messages: AgentMessage[]): boolean {
    const tokenCount = this.estimateTokenCount(messages);
    console.log(`Current token count: ${tokenCount}`);
    return tokenCount >= this.contextWindow * this.compactionThreshold;
  }

  estimateTokenCount(messages: AgentMessage[]): number {
    return messages.reduce((total, message) => {
      const text =
        message.role === "user"
          ? message.content.map((part) => part.text).join(" ")
          : message.role === "assistant"
            ? message.content
                .filter((part) => part.type === "text" || part.type === "thinking")
                .map((part) =>
                  part.type === "text" ? part.text : part.thinking,
                )
                .join(" ")
            : message.content
                .map((part) => part)
                .join(" ");

      return total + Math.ceil(text.length / 4);
    }, 0);
  }

  async compact(
    messages: AgentMessage[],
    provider: Provider,
    model: string,
    keepRecent = 20,
  ) {
    return compact(messages, provider, model, keepRecent);
  }
}