import type {
  AgentMessage,
  Session,
  SessionConfig,
  LoadedSession,
  SessionMessageEntry,
} from "../types.js";
import { SESSIONS_DIR } from "./path.js";
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";

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

  await mkdir(SESSIONS_DIR, { recursive: true });

  await appendFile(
    filePath,
    JSON.stringify({ type: "session", ...session }) + "\n",
    "utf8",
  );

  return session;
};

export const addSessionToList = async (session: Session) => {
  const listFilePath = `${SESSIONS_DIR}/session_list.jsonl`;

  await appendFile(listFilePath, JSON.stringify(session) + "\n", "utf8");
};

export const addMessageToSession = async (
  id: number,
  message: AgentMessage,
) => {
  const filePath = `${SESSIONS_DIR}/ses_${id}.jsonl`;

  await appendFile(
    filePath,
    JSON.stringify({ type: "message", ...message }) + "\n",
    "utf8",
  );
};

export const addMessagesToSession = async (
  id: number,
  messages: AgentMessage[],
  type?: string,
) => {
  const filePath = `${SESSIONS_DIR}/ses_${id}.jsonl`;

  if (messages.length === 0) {
    return;
  }

  const content =
    messages
      .map((message) =>
        JSON.stringify({
          type: type ?? "message",
          ...message,
        }),
      )
      .join("\n") + "\n";

  await appendFile(filePath, content, "utf8");
};

export const loadSession = async (
  id: number,
): Promise<LoadedSession | null> => {
  const filePath = `${SESSIONS_DIR}/ses_${id}.jsonl`;

  try {
    const data = await readFile(filePath, "utf8");
    const entries = parseJsonObjects(data);
    const messages: SessionMessageEntry[] = [];
    let session: Session | null = null;

    entries.forEach((entry) => {
      if (isSessionEntry(entry)) {
        const { type: _type, ...sessionData } = entry;
        session = sessionData;
      } else if (isSessionMessageEntry(entry)) {
        messages.push(entry);
      }
    });

    if (!session) {
      return null;
    }

    const finalMessages = buildContext(messages);
    const result = finalMessages.map(toAgentMessage);

    return { session, messages: result };
  } catch {
    return null;
  }
};

export const listSessions = async (): Promise<Session[]> => {
  try {
    const data = await readFile(`${SESSIONS_DIR}/session_list.jsonl`, "utf8");
    const sessions = parseJsonObjects(data)
      .filter(isSessionEntry)
      .map((entry) => {
        const { type: _type, ...session } = entry;
        return session;
      });

    return sessions.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
};

export const updateSessionModel = async (sessionId: string, model: string) => {
  const filePath = `${SESSIONS_DIR}/ses_${sessionId}.jsonl`;

  const data = await readFile(filePath, "utf8");

  const lines = data.split("\n");
  const firstLine = lines[0]?.trim();

  if (!firstLine) {
    throw new Error(`Session ${sessionId} is missing metadata`);
  }

  const metadata = JSON.parse(firstLine);

  metadata.model = model;
  metadata.updatedAt = Date.now();

  lines[0] = JSON.stringify(metadata);

  await writeFile(filePath, lines.join("\n"), "utf8");
};

const parseJsonObjects = (data: string): unknown[] => {
  const objects: unknown[] = [];
  const lines = data.split("\n");

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine) {
      try {
        objects.push(JSON.parse(trimmedLine));
      } catch {
        // Ignore malformed records and keep scanning.
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

const isSessionMessageEntry = (
  value: unknown,
): value is SessionMessageEntry => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    (value.type === "message" || value.type === "compaction") &&
    (value.role === "user" ||
      value.role === "assistant" ||
      value.role === "toolResult")
  );
};

const toAgentMessage = (entry: SessionMessageEntry): AgentMessage => {
  const { type: _type, ...message } = entry;
  return message as AgentMessage;
};

const buildContext = (
  entries: SessionMessageEntry[],
): SessionMessageEntry[] => {
  let compactionIndex = -1;

  for (let i = entries.length - 1; i >= 0; i -= 1) {
    if (entries[i]?.type === "compaction") {
      compactionIndex = i;
      break;
    }
  }

  if (compactionIndex === -1) {
    return entries;
  }

  const start = Math.max(0, compactionIndex - 20);
  let recentMessages = entries.slice(start, compactionIndex - 1);
  let afterCompaction = entries.slice(compactionIndex + 1);

  return [
    entries[compactionIndex] as SessionMessageEntry,
    ...recentMessages,
    ...afterCompaction,
  ];
};
