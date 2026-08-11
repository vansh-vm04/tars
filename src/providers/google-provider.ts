import {
  GoogleGenAI,
  Type,
  type Content,
  type GenerateContentParameters,
  type Tool,
  type GenerateContentResponse,
} from "@google/genai";
import type {
  LLMInput,
  AgentMessage,
  ParsedResponse,
  GeminiChatResponse,
} from "../types.js";
import { LLMError } from "../error.js";

export class GoogleProvider {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  chat = async (
    input: LLMInput,
  ): Promise<GeminiChatResponse | undefined> => {
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

    let interaction: GenerateContentResponse;

    try {
      interaction = await this.ai.models.generateContent(params);
    } catch (error: any) {
      if (error?.status === 429 || error?.code === 429) {
        throw new LLMError(
          "Gemini API quota exceeded. Please check your API quota or try another model.",
          429,
        );
      }

      throw new LLMError(
        error?.message ?? "Gemini API request failed.",
        error?.status ?? error?.code,
      );
    }

    return { content: this.parseGeminiResponse(interaction), parts: interaction.candidates?.[0]?.content?.parts ?? null };
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
            role: "assistant",
            parts: message.content,
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

    const text = parts
      .filter((part) => !part.thought )
      .map((part) => part.text ?? "")
      .join("\n");

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
