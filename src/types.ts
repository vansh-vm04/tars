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

export interface AgentTool<T extends Record<string, unknown>> {
  name: string;
  description: string;
  parameters: T;
}

export interface UserMessage {
  role: "user";
  content: string;
  timestamp: number;
}

export interface AssistantMessage {
  role: "assistant";
  content: Content[];
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
  execute(rl: readLine.Interface, agent: Agent, sessionManager?: SessionManager): Promise<void>;
}

export interface LLMResponse {
  content: ParsedResponse | null;
  parts: Content[] | null;
  isError: boolean;
  error: string | null;
}

export interface GeminiChatResponse {
  content: ParsedResponse | null;
  parts: Content[] | null;
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

export type Content = Part;