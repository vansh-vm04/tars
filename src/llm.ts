import type {
  LLMChatResponse,
  LLMInput,
  LLMResponse,
  Provider,
} from "./types.js";

const DEFAULT_RETRY_DELAY_MS = 5000;
const MAX_RETRY_DELAY_MS = 60000;
const MAX_TOTAL_RETRY_TIME_MS = 120000; // Maximum total time to spend retrying (2 minutes)

export const callLLM = async (
  provider: Provider,
  input: LLMInput,
): Promise<LLMResponse> => {
  let lastErrorMessage = "An unknown error occurred.";
  const startedAt = Date.now();

  while (Date.now() - startedAt <= MAX_TOTAL_RETRY_TIME_MS) {
  
    try {
      const response: LLMChatResponse = await provider.chat(input);

      if (response.isError) {
        lastErrorMessage = response.error || "An unknown error occurred.";

        if (!response.isRetryable) {
          return {
            content: null,
            parts: null,
            isError: true,
            error: lastErrorMessage,
          };
        }

        console.log("Retrying LLM call after error:", lastErrorMessage);

        const requestedDelayMs =
          response.retryAfterMs ?? DEFAULT_RETRY_DELAY_MS;
        const retryDelayMs = Math.min(
          Math.max(requestedDelayMs, 0),
          MAX_RETRY_DELAY_MS,
        );
        const elapsedMs = Date.now() - startedAt;
        const remainingMs = MAX_TOTAL_RETRY_TIME_MS - elapsedMs;

        if (remainingMs <= 0) {
          break;
        }

        await sleep(Math.min(retryDelayMs, remainingMs));
        continue;
      }

      return {
        content: response.content,
        parts: response.parts,
        isError: false,
        error: null,
      };
    } catch (error) {
      lastErrorMessage = "An unknown error occurred.";
    }
  }

  return {
    content: null,
    parts: null,
    isError: true,
    error: lastErrorMessage,
  };
};

const sleep = async (ms: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};
