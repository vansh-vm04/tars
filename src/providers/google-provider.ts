import {
  GoogleGenAI,
  Type,
  type Content,
  type GenerateContentParameters,
  type Part,
  type Tool,
  type GenerateContentResponse,
} from "@google/genai";
import type {
  LLMInput,
  AgentMessage,
  ParsedResponse,
  GeminiChatResponse,
  MessageContent,
  TextContent,
  ThinkingContent,
  ToolCall,
} from "../types.js";
import { LLMError } from "../error.js";

const normalizeMessageContent = (parts: Part[] | null | undefined): MessageContent[] =>
  (parts ?? [])
    .filter(
      (part) =>
        part.text !== undefined ||
        part.thought === true ||
        part.functionCall !== undefined,
    )
    .map((part): MessageContent => {
      if (part.thought === true) {
        const base: ThinkingContent = {
          type: "thinking",
          thinking: part.text ?? "",
        };

        if (part.thoughtSignature !== undefined) {
          base.thinkingSignature = part.thoughtSignature;
        }

        return base;
      }

      if (part.functionCall) {
        const toolCall: ToolCall = {
          type: "toolCall",
          id: part.functionCall.id ?? `${part.functionCall.name}-${Date.now()}`,
          name: part.functionCall.name ?? "",
          arguments: (part.functionCall.args ?? {}) as Record<string, any>,
        };

        if (part.thoughtSignature !== undefined) {
          toolCall.thoughtSignature = part.thoughtSignature;
        }

        return toolCall;
      }

      const textPart: TextContent = {
        type: "text",
        text: part.text ?? "",
      };

      return textPart;
    })
    .filter((part): boolean => {
      if (part.type === "text") {
        return part.text.length > 0;
      }

      if (part.type === "thinking") {
        return part.thinking.length > 0;
      }

      return !!part.name;
    });

const toGeminiParts = (content: MessageContent[]): Part[] =>
  content.map((part): Part => {
    if (part.type === "thinking") {
      const geminiPart: Part = {
        text: part.thinking,
        thought: true,
      };

      if (part.thinkingSignature !== undefined) {
        geminiPart.thoughtSignature = part.thinkingSignature;
      }

      return geminiPart;
    }

    if (part.type === "toolCall") {
      return {
        functionCall: {
          id: part.id,
          name: part.name,
          args: part.arguments,
        },
        thoughtSignature: part.thoughtSignature!,
      };
    }

    return {
      text: part.text,
    };
  });

export class GoogleProvider {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  chat = async (input: LLMInput): Promise<GeminiChatResponse | undefined> => {
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

    return {
      content: this.parseGeminiResponse(interaction),
      parts: normalizeMessageContent(
        interaction.candidates?.[0]?.content?.parts ?? null,
      ),
    };
  };

  buildContents = (messages: AgentMessage[]): Content[] =>
    messages.map((message): Content => {
      switch (message.role) {
        case "user": {
          const parts: Part[] = message.content.map(
            (part): Part => ({
              text: part.text,
            }),
          );

          return {
            role: "user",
            parts,
          };
        }

        case "assistant": {
          return {
            role: "assistant",
            parts: toGeminiParts(message.content),
          };
        }

        case "toolResult": {
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
      }
    });

  parseGeminiResponse = (response: GenerateContentResponse): ParsedResponse => {
    const parts = response.candidates?.[0]?.content?.parts ?? [];

    const text = parts
      .filter((part) => !part.thought)
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
