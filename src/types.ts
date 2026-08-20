import type { Schema, Part } from "@google/genai";
import type readLine from "node:readline/promises";
import type { Agent } from "./agent.js";
import type { GoogleProvider } from "./providers/google-provider.js";

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, Schema>;
  execute: (args: Record<string, any>) => Promise<ToolExecutionResult>;
}

export interface AgentLoopContext {
  model: string;
  provider: Provider;
  userMessage: string;
  systemPrompt: string;
  messages: SessionMessageEntry[];
  tools?: Tool[];
  shouldCompact: (messages: SessionMessageEntry[]) => boolean;
  compact: (messages: SessionMessageEntry[]) => Promise<CompactionResult>;
  saveMessage: (
    messages: (AgentMessage | SessionMessageEntry)[],
  ) => Promise<SessionMessageEntry[]>;
  onEvent?: (event: AgentEvent) => void;
}

export type AgentMessage = UserMessage | AssistantMessage | ToolResultMessage;

export type MessageContent = TextContent | ThinkingContent | ToolCall;

export interface TextContent {
  type: "text";
  text: string;
}

export interface ThinkingContent {
  type: "thinking";
  thinking: string;
  thinkingSignature?: string;
}

export interface AgentTool<T extends Record<string, unknown>> {
  name: string;
  description: string;
  parameters: T;
}

export interface UserMessage {
  role: "user";
  content: TextContent[];
  timestamp: number;
}

export interface AssistantMessage {
  role: "assistant";
  content: MessageContent[];
}

export interface ToolResultMessage {
  role: "toolResult";
  toolCallId: string;
  toolName: string;
  content: string[];
  isError: boolean;
  timestamp: number; // Unix timestamp in milliseconds
}

export interface ToolCall {
  type: "toolCall";
  id: string;
  name: string;
  arguments: Record<string, any>;
  thoughtSignature?: string;
}

export interface AgentConfig {
  messages?: SessionMessageEntry[];
  tools?: Tool[];
}

export type LLMInput = {
  model: string;
  systemPrompt: string;
  messages: AgentMessage[];
  tools: Tool[];
};

export type BashCommandOutput = {
  stdout: string;
  isError: boolean;
};

export type ToolExecutionResult = {
  content: string[];
  isError: boolean;
};

export type AuthConfig = {
  provider: string;
  apiKey: string;
};

export interface ParsedResponse {
  text: string;
  toolCalls: {
    name: string;
    args: Record<string, unknown>;
    id?: string | undefined;
  }[];
}

export interface Config {
  provider: string;
  model: string;
}

export interface Command {
  name: string;
  description: string;
  execute(rl: readLine.Interface, agent: Agent): Promise<void>;
}

export interface LLMResponse {
  content: ParsedResponse | null;
  parts: MessageContent[] | null;
  isError: boolean;
  error: string;
}

export interface LLMChatResponse {
  content: ParsedResponse | null;
  parts: MessageContent[] | null;
  isError: boolean;
  error: string | null;
  isRetryable?: boolean;
  retryAfterMs?: number;
}

export type Provider = GoogleProvider;

export interface Session {
  id: string;
  name: string;
  cwd: string;
  model: string;
  createdAt: number;
}

export interface SessionConfig {
  name: string;
  cwd: string;
  model: string;
}

export interface LoadedSession {
  session: Session;
  messages: SessionMessageEntry[];
}

export type SessionEntryType = "message" | "compaction";

export interface SessionMessageEntry {
  type: SessionEntryType;
  id: string;
  role: "user" | "assistant" | "toolResult";
  content: MessageContent[] | string[];
  toolCallId?: string;
  toolName?: string;
  isError?: boolean;
  timestamp?: number;
  lastCompactedMessageId?: string;
}

export type Content = Part; // Gemini specific parts response

export type ModelDefinition = {
  id: string;
  name: string;
  contextWindow: number;
  maxTokens: number;
  reasoning: boolean;
  provider: "google";
};

export type CompactionResult = {
  compactionEntry: SessionMessageEntry;
  updatedMessages: SessionMessageEntry[];
};

export type AgentLoopResponse = {
  finalResponse: string;
  updatedMessages: SessionMessageEntry[];
  isError: boolean;
};

export type StopReason = "stop" | "length" | "toolUse" | "error" | "aborted";

export type AgentEvent =
  | {
      type: "thinking-start";
    }
  | {
      type: "thinking-delta";
      text: string;
    }
  | {
      type: "thinking-end";
    }
  | {
      type: "text-start";
    }
  | {
      type: "text-delta";
      text: string;
    }
  | {
      type: "text-end";
    }
  | {
      type: "tool-call-start";
      id: string;
      name: string;
      arguments: Record<string, unknown>;
    }
  | {
      type: "tool-call-end";
      id: string;
      name: string;
      arguments: Record<string, unknown>;
    }
  | {
      type: "status";
      message: string;
    }
  | {
      type: "finish";
      reason: StopReason;
    }
  | {
      type: "error";
      error: string;
    };

export type LLMStreamEvent =
  | { type: "text-delta"; text: string }
  | { type: "thinking-delta"; text: string }
  | {
      type: "function-call-delta";
      id: string;
      name: string;
      arguments: string;
      thoughtSignature?: string;
    }
  | {
      type: "finish";
      reason: string;
    }
  | {
      type: "error";
      error: string;
      isRetryable?: boolean;
      retryAfterMs?: number;
    };

export interface AgentStreamResult {
  parts: MessageContent[];
  toolCalls: {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
  }[];
  text: string;
  isError: boolean;
  error: string;
}