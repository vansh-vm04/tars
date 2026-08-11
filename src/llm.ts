import { LLMError } from "./error.js";
import type {
  GeminiChatResponse,
  LLMInput,
  LLMResponse,
  Provider,
} from "./types.js";

export const callLLM = async (
  provider: Provider,
  input: LLMInput,
): Promise<LLMResponse> => {
  try {
    const response: GeminiChatResponse | undefined =
      await provider.chat(input);
    return {
      content: response?.content ?? null,
      parts: response?.parts ?? null,
      isError: false,
      error: null,
    };
  } catch (error) {
    return {
      content: null,
      parts: null,
      isError: true,
      error: (error as LLMError).message || "An unknown error occurred.",
    };
  }
};
