import {
  GoogleGenAI,
  Type,
  type Content,
  type GenerateContentParameters,
  type Tool,
  type GenerateContentResponse,
} from "@google/genai";
import type { LLMInput, AgentMessage, ParsedResponse } from "../types.js";
import dotenv from "dotenv";
dotenv.config();

export class GoogleProvider {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  geminiChat = async (
    input: LLMInput,
  ): Promise<
    | { content: ParsedResponse; interaction: GenerateContentResponse }
    | undefined
  > => {
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
      contents: this.buildContents(input.messages),
      config: {
        systemInstruction: input.systemPrompt,
        ...(tools.length && { tools }),
        thinkingConfig: {
          includeThoughts: true,
        },
      },
    };

    const interaction = await this.ai.models.generateContent(params);

    return { content: this.parseGeminiResponse(interaction), interaction };
  };

  buildContents = (messages: AgentMessage[]): Content[] =>
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
            parts: [
              message.content.candidates?.[0]?.content?.parts?.[0] ?? {
                text: "",
              },
            ],
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

  parseGeminiResponse = (response: GenerateContentResponse): ParsedResponse => {
    const parts = response.candidates?.[0]?.content?.parts ?? [];

    const text = parts.map((part) => part.text ?? "").join("");

    const toolCalls = parts
      .filter((part) => part.functionCall)
      .map((part) => ({
        name: part.functionCall!.name!,
        args: part.functionCall!.args ?? {},
        id: part.functionCall!.id,
      }));

    return { text, toolCalls };
  };
}
