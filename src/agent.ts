import { runAgentLoop } from "./agent-loop.js";
import {
  type AgentMessage,
  type Tool,
  type AgentConfig,
  type Provider,
} from "./types.js";
import { SYSTEM_PROMPT } from "./utils/system-prompt.js";

export class Agent {
  private tools: Tool[];
  private messages: AgentMessage[];
  private model: string;
  private provider: Provider;

  constructor(model: string, config: AgentConfig, provider: Provider) {
    this.messages = config.messages || [];
    this.tools = config.tools || [];
    this.model = model;
    this.provider = provider;
  }

  get toolsList(): Tool[] {
    return this.tools;
  }

  get messagesList(): AgentMessage[] {
    return this.messages;
  }

  set messagesList(messages: AgentMessage[]) {
    this.messages = messages;
  }

  get modelName(): string {
    return this.model;
  }

  set modelName(model: string) {
    this.model = model;
  }

  async prompt(
    newMessages: string[],
  ): Promise<{ message: string; isError: boolean }> {
    const response = await runAgentLoop(
      this.model,
      this.provider,
      this.messages,
      newMessages,
      {
        systemPrompt: SYSTEM_PROMPT,
        messages: this.messages,
        tools: this.tools,
      },
    );
    this.messages = response.messages;
    return { message: response.finalResponse || "", isError: response.isError };
  }
}
