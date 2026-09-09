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
  private isProcessing = false;
  private pendingMessages: string[] = [];
  private queueListeners = new Set<(count: number) => void>();
  private abortController: AbortController | null = null;

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

  get queueLength(): number {
    return this.pendingMessages.length;
  }

  get busy(): boolean {
    return this.isProcessing;
  }

  onQueueChange(handler: (count: number) => void): () => void {
    this.queueListeners.add(handler);
    return () => this.queueListeners.delete(handler);
  }

  private notifyQueue(): void {
    const count = this.pendingMessages.length;
    for (const h of this.queueListeners) h(count);
  }

  get pendingMessagesRef(): string[] {
    return this.pendingMessages;
  }

  interrupt(): void {
    // Signal the inner loop to stop after current turn and clear queued messages
    this.abortController?.abort();
    this.pendingMessages.length = 0;
    this.notifyQueue();
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

    if (this.isProcessing) {
      this.pendingMessages.push(userMessage);
      this.notifyQueue();
      return { message: "queued", isError: false };
    }

    this.isProcessing = true;
    this.notifyQueue();
    this.abortController = new AbortController();

    // Ensure session exists for the first message
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

    try {
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
        // Pass pending array by reference, inner loop will check and drain it
        pendingMessages: this.pendingMessages,
        abortSignal: this.abortController.signal,
      });

      this.messagesList = response.updatedMessages;
      // If aborted, surface as interrupted
      if (response.isError && response.finalResponse === "__ABORTED__") {
        return { message: "Interrupted", isError: true };
      }
      return { message: response.finalResponse || "", isError: response.isError };
    } finally {
      this.abortController = null;
      this.isProcessing = false;
      this.notifyQueue();
      // New message queued after inner loop's last check but before we cleared flag
      if (this.pendingMessages.length > 0) {
        const next = this.pendingMessages.shift()!;
        this.notifyQueue();
        void this.prompt(next).catch(() => {});
      }
    }
  }
}
