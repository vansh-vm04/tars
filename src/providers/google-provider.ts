import { GoogleGenAI, Type, type GenerateContentParameters, type Tool, type GenerateContentResponse } from "@google/genai";
import type { chatInput } from "../types.js";

const ai = new GoogleGenAI({});

export const geminiChat = async (input: chatInput, model: string) => {
  if (!input.contents.length) return;

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
    model,
    contents: input.contents,
    config: {
      systemInstruction: input.systemPrompt,
      ...(tools.length && { tools }),
    },
  };

  const interaction = await ai.models.generateContent(params);

  return parseGeminiResponse(interaction);
};

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