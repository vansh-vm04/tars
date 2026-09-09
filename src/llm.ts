import type { LLMInput, LLMStreamEvent, Provider } from "./types.js";

const DEFAULT_RETRY_DELAY_MS = 5000;
const MAX_RETRY_DELAY_MS = 60000;
const MAX_TOTAL_RETRY_TIME_MS = 120000; // Maximum total time to spend retrying (2 minutes)

export const callLLMStream = async function* (
  provider: Provider,
  input: LLMInput,
  opts?: { signal?: AbortSignal | undefined },
): AsyncGenerator<LLMStreamEvent, void, unknown> {
  const signal = opts?.signal;
  let lastErrorMessage = "An unknown error occurred.";
  const startedAt = Date.now();

  const checkAbort = () => {
    if (signal?.aborted) throw new AbortError("Aborted");
  };

  while (Date.now() - startedAt <= MAX_TOTAL_RETRY_TIME_MS) {
    checkAbort();
    let yieldedContent = false;
    try {
      const stream = provider.chatStream(input);

      for await (const event of stream) {
        checkAbort();
        if (event.type === "error") {
          if (event.isRetryable && !yieldedContent) {
            throw new RetryableError(
              event.error ?? "An unknown error occurred.",
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
      if (error instanceof AbortError || signal?.aborted) throw error;
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

      if (signal?.aborted) throw new AbortError("Aborted");
      if (!isRetryable || yieldedContent || remainingMs <= 0) {
        yield {
          type: "error",
          error: lastErrorMessage,
        };
        return;
      }

      const delayMs = Math.min(retryDelayMs, remainingMs);
      let remainingMsRetry = delayMs;

      yield {
        type: "retry",
        delaySeconds: Math.ceil(remainingMsRetry / 1000),
        reason: lastErrorMessage,
      };

      // Live countdown — emit an updated retry every second so the
      // message box and status show decreasing seconds
      while (remainingMsRetry > 0) {
        checkAbort();
        const step = Math.min(1000, remainingMsRetry);
        await sleep(step, signal);
        remainingMsRetry -= step;
        checkAbort();
        if (remainingMsRetry > 0) {
          yield {
            type: "retry",
            delaySeconds: Math.ceil(remainingMsRetry / 1000),
            reason: lastErrorMessage,
          };
        }
      }
    }
  }

  yield {
    type: "error",
    error: lastErrorMessage,
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

class AbortError extends Error {
  constructor(message = "Aborted") {
    super(message);
    this.name = "AbortError";
  }
}

const sleep = async (ms: number, signal?: AbortSignal): Promise<void> => {
  if (signal?.aborted) throw new AbortError();
  await new Promise<void>((resolve, reject) => {
    const id = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(id);
        reject(new AbortError());
      },
      { once: true },
    );
  });
};
