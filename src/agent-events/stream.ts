import type {
  AgentEvent,
  AgentStreamResult,
  LLMStreamEvent,
  MessageContent,
  StopReason,
} from "../types.js";
import { mapFinishReason, parseArgs } from "./utils.js";

export class AgentEventStream {
  private onEvent: ((event: AgentEvent) => void) | undefined = undefined;
  private textBuffer = "";
  private thinkingBuffer = "";
  private toolCalls = new Map<
    string,
    { name: string; args: string; thoughtSignature?: string }
  >();
  private thinkingOpen = false;
  private textOpen = false;
  private lastToolCallId: string | null = null;
  private finished = false;
  private streamError: string | null = null;

  constructor(onEvent?: (event: AgentEvent) => void) {
    this.onEvent = onEvent;
  }

  push(event: LLMStreamEvent): void {
    switch (event.type) {
      case "thinking-delta": {
        this.endText();
        this.startThinking();
        this.thinkingBuffer += event.text;
        this.emit({ type: "thinking-delta", text: event.text });
        break;
      }

      case "text-delta": {
        this.endThinking();
        this.startText();
        this.textBuffer += event.text;
        this.emit({ type: "text-delta", text: event.text });
        break;
      }

      case "function-call-delta": {
        this.endThinking();
        this.endText();
        if (this.lastToolCallId && this.lastToolCallId !== event.id) {
          this.closeToolCall();
        }
        if (this.lastToolCallId !== event.id) {
          this.lastToolCallId = event.id;
          this.toolCalls.set(event.id, {
            name: event.name,
            args: event.arguments,
            ...(event.thoughtSignature !== undefined && {
              thoughtSignature: event.thoughtSignature,
            }),
          });
        }
        const call = this.toolCalls.get(event.id)!;
        call.args = event.arguments;
        break;
      }

      case "finish": {
        this.finish(
          this.toolCalls.size > 0 ? "toolUse" : mapFinishReason(event.reason),
        );
        break;
      }

      case "error":
        this.streamError = event.error;
        this.finish("error");
        this.emit({ type: "error", error: event.error });
        break;
    }
  }

  error(error: Error): void {
    const err =
      error instanceof Error ? error : new Error("Unknown stream error.");
    this.streamError = err.message;
    this.finish("error");
    this.emit({ type: "error", error: err.message });
  }

  /** Finalizes any state left open if the stream ended without a finish event. */
  end(): void {
    this.finish(this.toolCalls.size > 0 ? "toolUse" : "stop");
  }

  result(): AgentStreamResult {
    if (this.streamError) {
      return {
        parts: [],
        toolCalls: [],
        text: "",
        isError: true,
        error: this.streamError,
      };
    }

    const parts: MessageContent[] = [];
    if (this.thinkingBuffer) {
      parts.push({ type: "thinking", thinking: this.thinkingBuffer });
    }
    if (this.textBuffer) {
      parts.push({ type: "text", text: this.textBuffer });
    }
    for (const [id, call] of this.toolCalls) {
      parts.push({
        type: "toolCall",
        id,
        name: call.name,
        arguments: parseArgs(call.args),
        ...(call.thoughtSignature !== undefined && {
          thoughtSignature: call.thoughtSignature,
        }),
      });
    }

    return {
      parts,
      toolCalls: [...this.toolCalls.entries()].map(([id, call]) => ({
        id,
        name: call.name,
        arguments: parseArgs(call.args),
      })),
      text: this.textBuffer,
      isError: false,
      error: "",
    };
  }

  private emit(event: AgentEvent): void {
    this.onEvent?.(event);
  }

  private endThinking(): void {
    if (this.thinkingOpen) {
      this.emit({ type: "thinking-end" });
      this.thinkingOpen = false;
    }
  }

  private endText(): void {
    if (this.textOpen) {
      this.emit({ type: "text-end" });
      this.textOpen = false;
    }
  }
  private startThinking(): void {
    if (!this.thinkingOpen) {
      this.emit({ type: "thinking-start" });
      this.thinkingOpen = true;
    }
  }

  private startText(): void {
    if (!this.textOpen) {
      this.emit({ type: "text-start" });
      this.textOpen = true;
    }
  }

  private closeToolCall(): void {
    if (this.lastToolCallId) {
      this.lastToolCallId = null;
    }
  }

  private finish(reason: StopReason): void {
    if (this.finished) return;
    this.finished = true;
    this.endThinking();
    this.endText();
    this.closeToolCall();
    this.emit({ type: "finish", reason });
  }
}
