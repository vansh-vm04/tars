import { runAgentLoop } from "./agent-loop.js";
import {
  type AgentMessage,
  type Tool,
  type AgentConfig,
  type chatInput,
} from "./types.js";
import { SYSTEM_PROMPT } from "./utils/system-prompt.js";

export class Agent {
  private tools: Tool[];
  private messages: AgentMessage[];
  private model: string;

  constructor(model: string, config: AgentConfig) {
    this.messages = config.messages || [];
    this.tools = config.tools || [];
    this.model = model;
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

  async prompt(input: chatInput) {
    return runAgentLoop(this.model, input, {
      systemPrompt: SYSTEM_PROMPT,
      messages: this.messages,
      tools: this.tools,
    });
  }
}
