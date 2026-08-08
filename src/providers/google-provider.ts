import { GoogleGenAI, Type, type Content, type FunctionCall, type GenerateContentParameters, type Part, type Tool, type GenerateContentResponse } from "@google/genai";
import type { LLMInput, AgentMessage } from "../types.js";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY ?? "" });

export const geminiChat = async (input: LLMInput) => {
  if (!input.messages.length) return;

  const tools: Tool[] = input.tools.map((tool) => ({
    functionDeclarations: [
      {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: Type.OBJECT,
          properties: tool.parameters,
        },
      },
    ],
  }));

  const params: GenerateContentParameters = {
    model: input.model,
    contents: buildContents(input.messages),
    config: {
      systemInstruction: input.systemPrompt,
      ...(tools.length && { tools }),
    },
  };

  const interaction = await ai.models.generateContent(params);

  return parseGeminiResponse(interaction);
};

const buildContents = (messages: AgentMessage[]): Content[] =>
  messages.map((message) => {
    switch (message.role) {
      case "user":
        return {
          role: "user",
          parts: [{ text: message.content }],
        };

      case "assistant":
        return {
          role: "model",
          parts: message.content.map((item): Part =>
            typeof item === "string"
              ? { text: item }
              : {
                  functionCall: {
                    name: item.name,
                    args: item.arguments,
                    id: item.id,
                  } as FunctionCall,
                },
          ),
        };

      case "toolResult":
        return {
          role: "user",
          parts: [
            {
              functionResponse: {
                name: message.toolName,
                id: message.toolCallId,
                response: { output: message.content.join("\n") },
              },
            },
          ],
        };
    }
  });

export interface ParsedResponse {
  text: string;
  toolCalls: { name: string; args: Record<string, unknown>; id?: string | undefined }[];
}

const parseGeminiResponse = (response: GenerateContentResponse): ParsedResponse => {
  const parts = response.candidates?.[0]?.content?.parts ?? [];

  const text = parts
    .map((part) => part.text ?? "")
    .join("");

  const toolCalls = parts
    .filter((part) => part.functionCall)
    .map((part) => ({
      name: part.functionCall!.name!,
      args: part.functionCall!.args ?? {},
      id: part.functionCall!.id,
    }));

  return { text, toolCalls };
};