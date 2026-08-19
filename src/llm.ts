import type {
  LLMChatResponse,
  LLMInput,
  LLMResponse,
  LLMStreamEvent,
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
        error: "",
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

export const callLLMStream = async function* (
  provider: Provider,
  input: LLMInput,
): AsyncGenerator<LLMStreamEvent, void, unknown> {
  let lastErrorMessage = "An unknown error occurred.";
  const startedAt = Date.now();

  while (Date.now() - startedAt <= MAX_TOTAL_RETRY_TIME_MS) {
    let yieldedContent = false;
    try {
      const stream = provider.chatStream(input);

      for await (const event of stream) {
        if (event.type === "error") {
          if (event.isRetryable && !yieldedContent) {
            throw new RetryableError(
              event.error.message,
              event.retryAfterMs ?? DEFAULT_RETRY_DELAY_MS,
            );
          }
          yield event;
          return;
        }

        yieldedContent = true;
        yield event;
      }

      return;
    } catch (error) {
      lastErrorMessage =
        error instanceof Error ? error.message : "An unknown error occurred.";

      const isRetryable = error instanceof RetryableError;
      const requestedDelayMs =
        error instanceof RetryableError
          ? error.retryAfterMs
          : DEFAULT_RETRY_DELAY_MS;
      const retryDelayMs = Math.min(
        Math.max(requestedDelayMs, 0),
        MAX_RETRY_DELAY_MS,
      );
      const elapsedMs = Date.now() - startedAt;
      const remainingMs = MAX_TOTAL_RETRY_TIME_MS - elapsedMs;

      if (!isRetryable || yieldedContent || remainingMs <= 0) {
        yield {
          type: "error",
          error: new Error(lastErrorMessage),
        };
        return;
      }

      console.log("Retrying LLM stream after error:", lastErrorMessage);
      await sleep(Math.min(retryDelayMs, remainingMs));
    }
  }

  yield {
    type: "error",
    error: new Error(lastErrorMessage),
  };
};

class RetryableError extends Error {
  constructor(
    message: string,
    readonly retryAfterMs: number,
  ) {
    super(message);
    this.name = "RetryableError";
  }
}

const sleep = async (ms: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};
