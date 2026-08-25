import { runAgentLoop } from "./agent-loop.js";
import { ContextManager } from "./context-manager.js";
import { SessionManager } from "./session-manager.js";
import {
  type Tool,
  type AgentConfig,
  type Provider,
  type SessionMessageEntry,
  type Session,
  type AgentEvent,
  type AgentMode,
} from "./types.js";
import { MODE_CONFIG } from "./modes.js";

const TARS_MAX_CONTEXT_WINDOW = 200_000;

export class Agent {
  private tools: Tool[];
  private messages: SessionMessageEntry[];
  private model: string;
  private provider: Provider;
  private contextManager: ContextManager;
  private sessionManager: SessionManager;
  private eventHandlers: ((event: AgentEvent) => void)[] = [];
  private _mode: AgentMode = "build";

  constructor(model: string, config: AgentConfig, provider: Provider) {
    this.messages = config.messages || [];
    this.tools = config.tools || [];
    this.model = model;
    this.provider = provider;
    this.contextManager = new ContextManager(TARS_MAX_CONTEXT_WINDOW);
    this.sessionManager = new SessionManager();
  }

  onEvent(handler: (event: AgentEvent) => void): void {
    this.eventHandlers.push(handler);
  }

  get toolsList(): Tool[] {
    return MODE_CONFIG[this._mode].tools as unknown as Tool[];
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

  get currentSessionName(): string | undefined {
    return this.sessionManager.currentSession?.name;
  }

  get mode(): AgentMode {
    return this._mode;
  }

  set mode(value: AgentMode) {
    this._mode = value;
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
    const { systemPrompt, tools } = MODE_CONFIG[this._mode];
    const response = await runAgentLoop({
      model: this.model,
      provider: this.provider,
      userMessage,
      systemPrompt,
      messages: this.messagesList,
      tools,
      shouldCompact: (messages) => this.contextManager.shouldCompact(messages),
      compact: (messages) =>
        this.contextManager.compact(messages, this.provider, this.model),
      estimateTokenCount: (messages) => this.contextManager.estimateTokenCount(messages),
      saveMessage: (messages) => this.sessionManager.saveMessage(messages),
      onEvent: (event) => {
        for (const handler of this.eventHandlers) handler(event);
      },
    });

    this.messagesList = response.updatedMessages;

    return { message: response.finalResponse || "", isError: response.isError };
  }
}
