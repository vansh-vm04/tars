import type {
  AgentMessage,
  Provider,
  Session,
  SessionConfig,
} from "./types.js";
import {
  addMessageToSession,
  addSessionToList,
  createSession,
  listSessions,
  loadSession,
} from "./storage/session.js";
import type { LoadedSession } from "./types.js";

export class SessionManager {
  private session: Session | undefined;

  get currentSession(): Session | undefined {
    return this.session;
  }

  set currentSession(session: Session) {
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
    return session;
  }

  async load(id: string): Promise<LoadedSession> {
    const sessionId = this.parseSessionId(id);
    const session = await loadSession(sessionId);

    if (!session) {
      throw new Error(`Session ${id} not found`);
    }

    return session;
  }

  async saveMessage(id: string, messages: AgentMessage[]): Promise<void> {
    const sessionId = this.parseSessionId(id);
    const sessions = await this.list();

    if (!sessions.find((s) => s.id === sessionId)) {
      throw new Error(`Session ${id} not found`);
    }
    for (const msg of messages) {
      await addMessageToSession(sessionId, msg);
    }
  }

  async list(): Promise<Session[]> {
    return listSessions();
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
    const response = await provider.geminiChat({
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
          content: message,
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
