import type { AgentMessage, Session, SessionConfig } from "./types.js";
import {
  addMessageToSession,
  addSessionToList,
  createSession,
  listSessions,
  loadSession,
} from "./storage/session.js";
import type { LoadedSession } from "./storage/session.js";

export class SessionManager {
  async create(config: SessionConfig): Promise<Session> {
    const session = await createSession(config);
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

  async saveMessage(id: string, message: AgentMessage): Promise<void> {
    const sessionId = this.parseSessionId(id);
    const sessions = await this.list();

    if (!sessions.find((s) => s.id === sessionId)) {
      throw new Error(`Session ${id} not found`);
    }

    await addMessageToSession(sessionId, message);
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
}
