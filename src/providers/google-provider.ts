import {
  GoogleGenAI,
  Type,
  type Content,
  type GenerateContentParameters,
  type Part,
  type Tool,
  type GenerateContentResponse,
  ThinkingLevel,
} from "@google/genai";
import type {
  LLMInput,
  AgentMessage,
  ParsedResponse,
  MessageContent,
  TextContent,
  ThinkingContent,
  ToolCall,
  LLMChatResponse,
  LLMStreamEvent,
} from "../types.js";

const resolveRetryAfterMs = (error: any) => {
  const retryDelay = error?.details?.find(
    (detail: any) =>
      detail?.["@type"] === "type.googleapis.com/google.rpc.RetryInfo",
  )?.retryDelay;

  if (!retryDelay) return 60000;

  const match = retryDelay.match(/^([\d.]+)s$/);

  return match ? Math.ceil(Number(match[1]) * 1000) : 60000;
};

const parseError = async (error: any): Promise<any> => {
  try {
    const parsed = await JSON.parse(error.message).error;
    const errorDetails = await JSON.parse(parsed.message).error;
    return errorDetails;
  } catch {
    return "An unknown error occurred.";
  }
};

const normalizeMessageContent = (
  parts: Part[] | null | undefined,
): MessageContent[] =>
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
        ...(part.thoughtSignature !== undefined && {
          thoughtSignature: part.thoughtSignature,
        }),
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

  chat = async (input: LLMInput): Promise<LLMChatResponse> => {
    if (!input.messages.length) {
      return {
        content: null,
        parts: null,
        isError: true,
        error: "No messages to send.",
      };
    }

    const params = this.buildParams(input);

    let interaction: GenerateContentResponse;

    try {
      interaction = await this.ai.models.generateContent(params);
    } catch (error: any) {
      const parsed = await parseError(error);
      if (parsed?.status === "RESOURCE_EXHAUSTED" || parsed?.code === 429) {
        return {
          content: null,
          parts: null,
          isError: true,
          error: parsed.message,
          isRetryable: true,
          retryAfterMs: resolveRetryAfterMs(parsed),
        };
      }

      return {
        content: null,
        parts: null,
        isError: true,
        error: parsed?.message ?? "An unknown error occurred.",
        isRetryable: false,
        retryAfterMs: 0,
      };
    }

    return {
      content: this.parseGeminiResponse(interaction),
      parts: normalizeMessageContent(
        interaction.candidates?.[0]?.content?.parts ?? null,
      ),
      isError: false,
      error: null,
    };
  };

  chatStream = async function* (
    this: GoogleProvider,
    input: LLMInput,
  ): AsyncGenerator<LLMStreamEvent, void, unknown> {
    if (!input.messages.length) {
      yield {
        type: "error",
        error: "No messages to send.",
      };
      return;
    }

    const params = this.buildParams(input);
    let stream: AsyncGenerator<GenerateContentResponse>;

    try {
      stream = await this.ai.models.generateContentStream(params);
    } catch (error: any) {
      const parsed = await parseError(error);
      if (parsed?.status === "RESOURCE_EXHAUSTED" || parsed?.code === 429) {
        yield {
          type: "error",
          error: parsed?.message ?? "Resource exhausted.",
          isRetryable: true,
          retryAfterMs: resolveRetryAfterMs(parsed),
        };
        return;
      }
      yield {
        type: "error",
        error: parsed?.message ?? "Unknown error starting stream.",
      };
      return;
    }

    let pendingFunctionCall: {
      id: string;
      name: string;
      arguments: string;
      thoughtSignature?: string;
    } | null = null;

    try {
      for await (const chunk of stream) {
        const parts = chunk.candidates?.[0]?.content?.parts ?? [];

        for (const part of parts) {
          if (part.thought === true) {
            if (part.text) {
              yield { type: "thinking-delta", text: part.text };
            }
            continue;
          }

          if (part.functionCall) {
            const id = part.functionCall.id ?? "";
            const name = part.functionCall.name ?? "";

            if (
              !pendingFunctionCall ||
              pendingFunctionCall.id !== id ||
              pendingFunctionCall.name !== name
            ) {
              pendingFunctionCall = {
                id,
                name,
                arguments: "",
              };
            }

            if (part.thoughtSignature !== undefined) {
              pendingFunctionCall.thoughtSignature = part.thoughtSignature;
            }

            if (part.functionCall.args) {
              pendingFunctionCall.arguments = JSON.stringify(
                part.functionCall.args,
              );
            } else {
              pendingFunctionCall.arguments += part.text ?? "";
            }

            yield {
              type: "function-call-delta",
              id: pendingFunctionCall.id,
              name: pendingFunctionCall.name,
              arguments: pendingFunctionCall.arguments,
              ...(pendingFunctionCall.thoughtSignature !== undefined && {
                thoughtSignature: pendingFunctionCall.thoughtSignature,
              }),
            };
            continue;
          }

          if (part.text) {
            yield { type: "text-delta", text: part.text };
          }
        }

        const finishReason = chunk.candidates?.[0]?.finishReason;
        if (finishReason && finishReason !== "FINISH_REASON_UNSPECIFIED") {
          yield {
            type: "finish",
            reason: finishReason,
          };
        }
      }
    } catch (error: any) {
      const parsed = await parseError(error);
      if (parsed?.status === "RESOURCE_EXHAUSTED" || parsed?.code === 429) {
        yield {
          type: "error",
          error: parsed?.message ?? "Resource exhausted.",
          isRetryable: true,
          retryAfterMs: resolveRetryAfterMs(parsed),
        };
        return;
      }
      yield {
        type: "error",
        error: parsed?.message ?? "Unknown stream error.",
      };
      return;
    }
  };

  private buildParams = (input: LLMInput): GenerateContentParameters => {
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

    return {
      model: input.model,
      contents: this.buildContents(input.messages),
      config: {
        systemInstruction: input.systemPrompt,
        ...(tools.length && { tools }),
        thinkingConfig: {
          includeThoughts: true,
          thinkingLevel: ThinkingLevel.HIGH,
        },
      },
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
