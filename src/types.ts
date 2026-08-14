import type { Schema, Part } from "@google/genai";
import readLine from "node:readline/promises";
import type { Agent } from "./agent.js";
import { GoogleProvider } from "./providers/google-provider.js";
import type { SessionManager } from "./session-manager.js";

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, Schema>;
  execute: (args: Record<string, any>) => Promise<ToolExecutionResult>;
}

export interface Context {
  systemPrompt: string;
  messages: AgentMessage[];
  tools?: Tool[];
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

export interface ToolResultMessage<TDetails = any> {
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
  messages?: AgentMessage[];
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
  execute(
    rl: readLine.Interface,
    agent: Agent,
    sessionManager?: SessionManager,
  ): Promise<void>;
}

export interface LLMResponse {
  content: ParsedResponse | null;
  parts: MessageContent[] | null;
  isError: boolean;
  error: string | null;
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
  id: number;
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
  messages: AgentMessage[];
}

export type SessionEntryType = "message" | "compaction";

export interface SessionMessageEntry {
  type: SessionEntryType;
  role: "user" | "assistant" | "toolResult";
  content: MessageContent[];
  toolCallId?: string;
  toolName?: string;
  isError?: boolean;
  timestamp?: number;
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
  compactionEntry: AgentMessage;
  updatedMessages: AgentMessage[];
};