import type { AgentMessage, Session, SessionConfig } from "../types.js";
import { SESSIONS_DIR } from "./path.js";
import { appendFile, readFile } from "node:fs/promises";

export interface LoadedSession {
  session: Session;
  messages: AgentMessage[];
}

export const createSession = async (
  config: SessionConfig,
): Promise<Session> => {
  const id = Date.now();

  const session: Session = {
    id,
    name: config.name,
    cwd: config.cwd,
    model: config.model,
    createdAt: id,
  };

  const filePath = `${SESSIONS_DIR}/ses_${id}.jsonl`;

  await appendFile(
    filePath,
    JSON.stringify({ type: "session", ...session }, null, 2),
    "utf8",
  );

  return session;
};

export const addSessionToList = async (session: Session) => {
  const listFilePath = `${SESSIONS_DIR}/session_list.jsonl`;

  await appendFile(listFilePath, JSON.stringify(session, null, 2), "utf8");
};

export const addMessageToSession = async (
  id: number,
  message: AgentMessage,
) => {
  const filePath = `${SESSIONS_DIR}/ses_${id}.jsonl`;

  await appendFile(
    filePath,
    JSON.stringify({ type: "message", ...message }, null, 2),
    "utf8",
  );
};

export const loadSession = async (
  id: number,
): Promise<LoadedSession | null> => {
  const filePath = `${SESSIONS_DIR}/ses_${id}.jsonl`;

  try {
    const data = await readFile(filePath, "utf8");
    const entries = parseJsonObjects(data);
    const sessionEntry = entries.find(isSessionEntry);

    if (!sessionEntry) {
      return null;
    }

    const { type: _type, ...session } = sessionEntry;
    const messages = entries.filter(isMessageEntry).map((entry) => {
      const { type: _messageType, ...message } = entry;
      return message;
    });

    return { session, messages };
  } catch {
    return null;
  }
};

export const listSessions = async (): Promise<Session[]> => {
  try {
    const data = await readFile(`${SESSIONS_DIR}/session_list.jsonl`, "utf8");
    const sessions = parseJsonObjects(data) as Session[];

    return sessions.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
};

const parseJsonObjects = (data: string): unknown[] => {
  const objects: unknown[] = [];
  let depth = 0;
  let inString = false;
  let escaped = false;
  let startIndex = -1;

  for (let index = 0; index < data.length; index += 1) {
    const char = data[index];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === "\\") {
        escaped = true;
        continue;
      }

      if (char === '"') {
        inString = false;
      }

      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      if (depth === 0) {
        startIndex = index;
      }

      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;

      if (depth === 0 && startIndex !== -1) {
        const rawObject = data.slice(startIndex, index + 1);

        try {
          const parsed = JSON.parse(rawObject) as Record<string, unknown>;
          objects.push(parsed);
        } catch {
          // Ignore malformed records and keep scanning.
        }

        startIndex = -1;
      }
    }
  }

  return objects;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const isSessionEntry = (
  value: unknown,
): value is Session & { type?: string } => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.type === "session" ||
    (typeof value.id === "number" &&
      typeof value.cwd === "string" &&
      typeof value.model === "string" &&
      typeof value.createdAt === "number")
  );
};

const isMessageEntry = (
  value: unknown,
): value is AgentMessage & { type?: string } => {
  if (!isRecord(value)) {
    return false;
  }

  if (value.type === "message") {
    return true;
  }

  return (
    value.role === "user" ||
    value.role === "assistant" ||
    value.role === "toolResult"
  );
};
