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
      await provider.geminiChat(input);
    return {
      content: response?.content ?? null,
      interaction: response?.interaction ?? null,
      isError: false,
      error: null,
    };
  } catch (error) {
    return {
      content: null,
      interaction: null,
      isError: true,
      error: (error as LLMError).message || "An unknown error occurred.",
    };
  }
};
