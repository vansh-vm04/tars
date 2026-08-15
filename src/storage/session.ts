import type {
  AgentMessage,
  Session,
  SessionConfig,
  LoadedSession,
  SessionMessageEntry,
} from "../types.js";
import { SESSIONS_DIR } from "./path.js";
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { toAgentMessage } from "../utils/common.js";

export const createSession = async (
  config: SessionConfig,
): Promise<Session> => {
  const id = generateUniqueId();

  const session: Session = {
    id,
    name: config.name,
    cwd: config.cwd,
    model: config.model,
    createdAt: Date.now(),
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
  sessionId: string,
  message: AgentMessage,
) => {
  const filePath = `${SESSIONS_DIR}/ses_${sessionId}.jsonl`;

  await appendFile(
    filePath,
    JSON.stringify({ type: "message", id: generateUniqueId(), ...message }) +
      "\n",
    "utf8",
  );
};

export const addMessagesToSession = async (
  sessionId: string,
  messages: (AgentMessage | SessionMessageEntry)[],
  type?: string,
): Promise<SessionMessageEntry[]> => {
  const filePath = `${SESSIONS_DIR}/ses_${sessionId}.jsonl`;

  if (messages.length === 0) {
    return [];
  }

  const sessionEntries = messages.map((message) => {
    if (isSessionMessageEntry(message) && message?.type === "compaction") {
      return { ...message } as SessionMessageEntry;
    }
    return {
      type: type ?? "message",
      id: generateUniqueId(),
      ...message,
    } as SessionMessageEntry;
  });

  const content =
    sessionEntries.map((entry) => JSON.stringify(entry)).join("\n") + "\n";

  await appendFile(filePath, content, "utf8");

  return sessionEntries;
};

export const loadSession = async (
  sessionId: string,
): Promise<LoadedSession | null> => {
  const filePath = `${SESSIONS_DIR}/ses_${sessionId}.jsonl`;

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

    return { session, messages: finalMessages };
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

const buildContext = (
  entries: SessionMessageEntry[],
): SessionMessageEntry[] => {
  let compactionIndex = -1;
  let lastCompactionIndex: number | undefined;

  for (let i = entries.length - 1; i >= 0; i -= 1) {
    if (entries[i]?.type === "compaction") {
      compactionIndex = i;
    }
    if (
      compactionIndex !== -1 &&
      entries[i]?.id === entries[compactionIndex]?.lastCompactedMessageId
    ) {
      lastCompactionIndex = i;
      break;
    }
  }

  if (compactionIndex === -1) {
    return entries;
  }

  let afterCompaction = entries
    .slice(lastCompactionIndex! + 1)
    .filter((m) => m.type !== "compaction");

  return [entries[compactionIndex] as SessionMessageEntry, ...afterCompaction];
};

const generateUniqueId = (): string => {
  return randomUUID();
};
