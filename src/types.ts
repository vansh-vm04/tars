import type { Schema, GenerateContentResponse } from "@google/genai";
import readLine from "node:readline/promises";
import type { Agent } from "./agent.js";

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
  content: GenerateContentResponse;
  toolCalls?: ToolCall[];
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
  execute(rl: readLine.Interface, agent: Agent): Promise<void>;
}
