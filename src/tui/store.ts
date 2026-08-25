import type { AgentEvent, SessionMessageEntry } from "../types.js";
import type { ViewMessage } from "./types.js";

let sequence = 0;
const nextId = (): string => `m${++sequence}`;

export class UiStore {
  readonly messages: ViewMessage[] = [];
  streaming = false;
  status = "";
  private version = 0;
  private listeners = new Set<() => void>();

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): number => this.version;

  private notify(): void {
    this.version++;
    for (const listener of this.listeners) listener();
  }

  addUserMessage(text: string): void {
    this.messages.push({
      id: nextId(),
      role: "user",
      text,
      thinking: "",
      thinkingOpen: false,
      toolCalls: [],
      finished: true,
    });
    this.notify();
  }

  addSystemMessage(text: string): void {
    this.messages.push({
      id: nextId(),
      role: "system",
      text,
      thinking: "",
      thinkingOpen: false,
      toolCalls: [],
      finished: true,
    });
    this.notify();
  }

  pushError(text: string): void {
    this.messages.push({
      id: nextId(),
      role: "error",
      text,
      thinking: "",
      thinkingOpen: false,
      toolCalls: [],
      finished: true,
    });
    this.notify();
  }

  setStreaming(streaming: boolean): void {
    if (this.streaming === streaming) return;
    this.streaming = streaming;
    this.notify();
  }

  setStatus(status: string): void {
    if (this.status === status) return;
    this.status = status;
    this.notify();
  }

  clear(): void {
    this.messages.length = 0;
    this.notify();
  }

  loadMessages(messages: SessionMessageEntry[]): void {
    for (const message of messages) {
      if (message.type === "compaction") {
        continue;
      }
      if (message.role === "user") {
        this.addUserMessage(
          message.content
            .map((c) => (typeof c === "string" ? c : (c as any).text))
            .join(""),
        );
      } else if (message.role === "assistant") {
        const viewMessage: ViewMessage = {
          id: message.id,
          role: "assistant",
          text: "",
          thinking: "",
          thinkingOpen: false,
          toolCalls: [],
          finished: true,
        };

        for (const content of message.content) {
          if (typeof content === "string") {
            viewMessage.text += content;
          } else {
            const c = content as any;
            if (c.type === "text") {
              viewMessage.text += c.text;
            } else if (c.type === "thinking") {
              viewMessage.thinking += c.thinking;
            } else if (c.type === "toolCall") {
              viewMessage.toolCalls.push({
                id: c.id,
                name: c.name,
                label: describeToolCall(c.name, c.arguments),
                status: "done",
              });
            }
          }
        }
        this.messages.push(viewMessage);
      }
    }
    this.notify();
  }

  private ensureAssistant(): ViewMessage {
    const last = this.messages[this.messages.length - 1];
    if (last && last.role === "assistant" && !last.finished) return last;
    const message: ViewMessage = {
      id: nextId(),
      role: "assistant",
      text: "",
      thinking: "",
      thinkingOpen: false,
      toolCalls: [],
      finished: false,
    };
    this.messages.push(message);
    return message;
  }

  think(text: string): void {
    const message = this.ensureAssistant();
    message.thinkingOpen = true;
    message.thinking += text;
    this.notify();
  }

  endThinking(): void {
    const message = this.ensureAssistant();
    message.thinkingOpen = false;
    this.notify();
  }

  text(text: string): void {
    const message = this.ensureAssistant();
    message.text += text;
    this.notify();
  }

  finish(): void {
    const message = this.ensureAssistant();
    message.finished = true;
    this.notify();
  }

  tool(id: string, name: string, label: string): void {
    const message = this.ensureAssistant();
    message.toolCalls.push({ id, name, label, status: "running" });
    this.notify();
  }

  toolEnd(id: string): void {
    const message = this.messages[this.messages.length - 1];
    if (!message) return;
    const call = message.toolCalls.find((c) => c.id === id);
    if (call) call.status = "done";
    this.notify();
  }
}

export const applyAgentEvent = (store: UiStore, event: AgentEvent): void => {
  switch (event.type) {
    case "thinking-start":
      store.think("");
      break;
    case "thinking-delta":
      store.think(event.text);
      break;
    case "thinking-end":
      store.endThinking();
      break;
    case "text-start":
      store.text("");
      break;
    case "text-delta":
      store.text(event.text);
      break;
    case "text-end":
      break;
    case "tool-call-start": {
      const label = describeToolCall(event.name, event.arguments);
      store.tool(event.id, event.name, label);
      break;
    }
    case "tool-call-end":
      store.toolEnd(event.id);
      break;
    case "finish":
      store.finish();
      break;
    case "status":
      store.addSystemMessage(event.message);
      store.setStatus(event.message);
      break;
    case "compaction_start":
      store.addSystemMessage("ⓘ Compacting conversation…");
      store.setStatus("Compacting conversation…");
      break;
    case "compaction_end":
      store.addSystemMessage(`✦ Conversation compacted (tokens: ${event.tokensBefore} → ${event.tokensAfter}). \nTokens Saved: ${event.tokensBefore - event.tokensAfter}`);
      store.setStatus("");
      break;
    case "retry":
      store.addSystemMessage(`ⓘ ${event.reason}`);
      store.setStatus(`Retrying in ${Math.ceil(event.delaySeconds)}s...`);
      break;
    case "error":
      store.finish();
      store.pushError(event.error);
      break;
  }
};

const describeToolCall = (
  name: string,
  args: Record<string, unknown>,
): string => {
  const usage = args.usage ?? args.value ?? args.query ?? args.input ?? args.path ?? args.command;
  if (usage === undefined) return name;
  const text = String(usage).replace(/\s+/g, " ").trim();
  if (text.length > 60) return `${name} ${text.slice(0, 60)}...`;
  return text ? `${name} ${text}` : name;
};