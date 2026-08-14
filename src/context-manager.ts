import { compact } from "./compaction/compaction.js";
import type { AgentMessage, Provider } from "./types.js";
import { estimateTokenCount } from "./compaction/utils.js";

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
    return estimateTokenCount(messages);
  }

  async compact(
    messages: AgentMessage[],
    provider: Provider,
    model: string,
    keepRecent = 20,
  ) {
    return compact(messages, provider, model);
  }
}