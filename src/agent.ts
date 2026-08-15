import { runAgentLoop } from "./agent-loop.js";
import { ContextManager } from "./context-manager.js";
import { SessionManager } from "./session-manager.js";
import {
  type Tool,
  type AgentConfig,
  type Provider,
  type SessionMessageEntry,
  type Session,
} from "./types.js";
import { toAgentMessage } from "./utils/common.js";
import { SYSTEM_PROMPT } from "./utils/system-prompt.js";
import chalk from "chalk";

const TARS_MAX_CONTEXT_WINDOW = 200_000;

export class Agent {
  private tools: Tool[];
  private messages: SessionMessageEntry[];
  private model: string;
  private provider: Provider;
  private contextManager: ContextManager;
  private sessionManager: SessionManager;

  constructor(model: string, config: AgentConfig, provider: Provider) {
    this.messages = config.messages || [];
    this.tools = config.tools || [];
    this.model = model;
    this.provider = provider;
    this.contextManager = new ContextManager(TARS_MAX_CONTEXT_WINDOW);
    this.sessionManager = new SessionManager();
  }

  get toolsList(): Tool[] {
    return this.tools;
  }

  get messagesList(): SessionMessageEntry[] {
    return this.messages;
  }

  set messagesList(messages: SessionMessageEntry[]) {
    this.messages = messages;
  }

  get modelName(): string {
    return this.model;
  }

  allSessions(): Promise<Session[]> {
    return this.sessionManager.listSessions();
  }

  async loadSession(sessionId: string) {
    const session = await this.sessionManager.load(sessionId);
    this.setModelName(session.session.model);
    this.messagesList = session.messages;
    return session.session;
  }

  clearSession() {
    this.messages = [];
    this.sessionManager.currentSession = undefined;
  }

  async setModelName(model: string) {
    await this.sessionManager.updateModel(model);
    this.model = model;
  }

  async prompt(
    userMessage: string,
  ): Promise<{ message: string; isError: boolean }> {
    if (!this.sessionManager.currentSession) {
      await this.sessionManager.create(
        this.provider,
        {
          name: "New Session",
          cwd: process.cwd(),
          model: this.model,
        },
        userMessage,
      );
    }
    if (this.contextManager.shouldCompact(this.messagesList)) {
      console.log(chalk.yellowBright("\n\n => Compacting conversation...\n\n"));
      const compacted = await this.contextManager.compact(
        this.messagesList,
        this.provider,
        this.model,
      );
      this.messagesList = compacted.updatedMessages;
      await this.sessionManager.saveMessage([compacted.compactionEntry]);
    }
    const response = await runAgentLoop(
      this.model,
      this.provider,
      userMessage,
      {
        systemPrompt: SYSTEM_PROMPT,
        messages: this.messagesList.map(toAgentMessage),
        tools: this.toolsList,
      },
    );

    const savedMessages = await this.sessionManager.saveMessage(
      response.newMessages,
    );
    this.messagesList = [...this.messagesList, ...savedMessages];

    return { message: response.finalResponse || "", isError: response.isError };
  }
}
