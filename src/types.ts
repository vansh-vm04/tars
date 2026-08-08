import type { Content, Schema } from "@google/genai";

export interface Tool {
    name: string;
    description: string;
    parameters: Record<string, Schema>;
}

export interface chatInput {
    systemPrompt: string;
    contents: Content[];
    tools: Tool[];
}

export interface Context {
    systemPrompt: string;
	messages: AgentMessage[];
	tools?: AgentTool<any>[];
}

export type AgentMessage = UserMessage | AssistantMessage | ToolResultMessage;

export interface AgentTool<T extends Record<string, unknown>> {
    name: string;
    description: string;
    parameters: T;
}

export interface UserMessage {
	role: "user";
	content: string
	timestamp: number; 
}

export interface AssistantMessage {
	role: "assistant";
	content: (string | ToolCall)[];
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