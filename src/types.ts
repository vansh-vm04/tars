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