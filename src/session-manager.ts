import type {
  AgentMessage,
  Provider,
  Session,
  SessionConfig,
  LoadedSession,
} from "./types.js";
import {
  addSessionToList,
  createSession,
  addMessagesToSession,
  loadSession,
  updateSessionModel,
} from "./storage/session.js";

export class SessionManager {
  private session: Session | undefined;

  get currentSession(): Session | undefined {
    return this.session;
  }

  set currentSession(session: Session | undefined) {
    this.session = session;
  }

  async create(
    provider: Provider,
    config: SessionConfig,
    firstMessage: string,
  ): Promise<Session> {
    if (!firstMessage.trim()) {
      throw new Error("Cannot create a session from empty input");
    }

    const sessionName = await this.generateSessionName(provider, firstMessage);
    const session = await createSession({ ...config, name: sessionName });
    await addSessionToList(session);

    this.session = session;

    return session;
  }

  async load(id: string): Promise<LoadedSession> {
    const sessionId = this.parseSessionId(id);
    const session = await loadSession(sessionId);

    if (!session) {
      throw new Error(`Session ${id} not found`);
    }

    this.session = session.session;
    return session;
  }

  async saveMessage(messages: AgentMessage[], type?: string): Promise<void> {
    if (!this.session) {
      throw new Error("No active session");
    }
    await addMessagesToSession(this.session.id, messages, type);
  }

  async updateModel(model: string): Promise<void> {
    if (this.session) {
      await updateSessionModel(String(this.session.id), model);
    }
  }

  private parseSessionId(id: string): number {
    const sessionId = Number.parseInt(id, 10);

    if (Number.isNaN(sessionId)) {
      throw new Error(`Invalid session id: ${id}`);
    }

    return sessionId;
  }

  private async generateSessionName(
    provider: Provider,
    message: string,
  ): Promise<string> {
    const response = await provider.chat({
      model: "gemini-3.1-flash-lite",
      systemPrompt: `
        Generate a short, plain-text title for this conversation.

        Rules:
        - Return only the title.
        - Do not use Markdown.
        - Do not use quotes.
        - Do not use backticks.
        - Do not use emojis.
        - Do not add punctuation at the end.
        - Do not explain the title.
        - Keep it between 2 and 6 words.
        - Describe the main task or topic of the user's message.
        `,
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: message }],
          timestamp: Date.now(),
        },
      ],
      tools: [],
    });

    const title = response?.content?.text
      .trim()
      .replace(/^["'`]+|["'`]+$/g, "")
      .replace(/[*_#]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    return title || message.substring(0, 40).trim();
  }
}
