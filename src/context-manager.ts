import { compact } from "./compaction/compaction.js";
import type { AgentMessage, Provider, SessionMessageEntry } from "./types.js";
import { estimateTokenCount } from "./compaction/utils.js";
import { toAgentMessage } from "./utils/common.js";

export class ContextManager {
  constructor(
    private readonly contextWindow: number,
    private readonly compactionThreshold = 0.7,
  ) {}

  shouldCompact(messages: SessionMessageEntry[]): boolean {
    const tokenCount = this.estimateTokenCount(messages.map(toAgentMessage));
    console.log(`Current token count: ${tokenCount}`);
    return tokenCount >= this.contextWindow * this.compactionThreshold;
  }

  estimateTokenCount(messages: AgentMessage[]): number {
    return estimateTokenCount(messages);
  }

  async compact(
    messages: SessionMessageEntry[],
    provider: Provider,
    model: string,
  ) {
    return compact(messages, provider, model);
  }
}
