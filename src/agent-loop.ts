import { callLLMStream } from "./llm.js";
import type {
  AgentLoopContext,
  AgentLoopResponse,
  SessionMessageEntry,
  ToolExecutionResult,
} from "./types.js";
import { toAgentMessage } from "./utils/common.js";
import { AgentEventStream } from "./agent-events/stream.js";

export const runAgentLoop = async (
  context: AgentLoopContext,
): Promise<AgentLoopResponse> => {
  let oldMessages: SessionMessageEntry[] = context.messages || [];
  let newMessages: SessionMessageEntry[] = [];
  let savedMessages: SessionMessageEntry[] = [];
  const tools = context.tools || [];
  const { model, provider, userMessage, systemPrompt, onEvent } = context;

  const toAgentMessages = (entries: SessionMessageEntry[]) =>
    entries.map(toAgentMessage);

  const allMessages = () => [...oldMessages, ...savedMessages, ...newMessages];

  const compactIfNeeded = async () => {
    const messages = allMessages();
    if (!context.shouldCompact(messages)) return;
    const tokensBefore = context.estimateTokenCount?.(messages.map(toAgentMessage)) || 0;
    onEvent?.({ type: "compaction_start" });
    const result = await context.compact(messages);
    const tokensAfter = context.estimateTokenCount?.(result.updatedMessages.map(toAgentMessage)) || 0;
    if (newMessages.length > 0) {
      await context.saveMessage(newMessages);
    }
    await context.saveMessage([result.compactionEntry]);
    oldMessages = result.updatedMessages;
    newMessages = [];
    savedMessages = [];
    onEvent?.({ type: "compaction_end", tokensBefore, tokensAfter });
  };

  const persistNewMessages = async (): Promise<SessionMessageEntry[]> => {
    if (newMessages.length === 0) return [];
    const saved = await context.saveMessage(newMessages);
    newMessages = [];
    savedMessages.push(...saved);
    return saved;
  };

  const streamTurn = async () => {
    const stream = new AgentEventStream(onEvent);
    try {
      for await (const event of callLLMStream(provider, {
        model,
        systemPrompt,
        messages: toAgentMessages(allMessages()),
        tools,
      })) {
        stream.push(event);
      }
      stream.end();
    } catch (err) {
      stream.error(err instanceof Error ? err : new Error("Unknown stream error."));
    }
    return stream.result();
  };

  // Initial compaction of the carried-over conversation before the turn
  await compactIfNeeded();

  newMessages.push({
    type: "message",
    id: crypto.randomUUID(),
    role: "user",
    content: [{ type: "text", text: userMessage }],
    timestamp: Date.now(),
  });

  let finalResponse = "";
  let lastResult: { message: string; isError: boolean } | null = null;

  while (true) {
    const turn = await streamTurn();

    if (turn.isError) {
      await persistNewMessages();
      const pending = context.pendingMessages;
      if (pending && pending.length > 0) {
        const toAdd = pending.splice(0);
        for (const msg of toAdd) {
          newMessages.push({
            type: "message",
            id: crypto.randomUUID(),
            role: "user",
            content: [{ type: "text", text: msg }],
            timestamp: Date.now(),
          });
        }
        await compactIfNeeded();
        finalResponse = turn.error;
        lastResult = { message: finalResponse, isError: true };
        continue;
      }
      return {
        finalResponse: turn.error,
        updatedMessages: [...oldMessages, ...savedMessages],
        isError: true,
      };
    }

    if (turn.toolCalls.length > 0) {
      newMessages.push({
        type: "message",
        id: crypto.randomUUID(),
        role: "assistant",
        content: turn.parts,
      });
      await persistNewMessages();
      for (const toolCall of turn.toolCalls) {
        const tool = tools.find((t) => t.name === toolCall.name);
        if (!tool) {
          newMessages.push({
            type: "message",
            id: crypto.randomUUID(),
            role: "toolResult",
            toolCallId: toolCall.id || "",
            toolName: toolCall.name,
            content: [`Tool "${toolCall.name}" not found.`],
            isError: true,
            timestamp: Date.now(),
          });
          await persistNewMessages();
          continue;
        }
        const toolCallId = toolCall.id || `${tool.name}-${Date.now()}`;
        let result: ToolExecutionResult;
        try {
          onEvent?.({
            type: "tool-call-start",
            id: toolCallId,
            name: tool.name,
            arguments: toolCall.arguments,
          });
          result = await tool.execute(toolCall.arguments);
        } catch (err) {
          result = {
            content: [
              `Error executing tool "${toolCall.name}": ${(err as Error).message}`,
            ],
            isError: true,
          };
        }
        onEvent?.({
          type: "tool-call-end",
          id: toolCallId,
          name: tool.name,
          arguments: toolCall.arguments,
        });
        newMessages.push({
          type: "message",
          id: crypto.randomUUID(),
          role: "toolResult",
          toolCallId: toolCallId,
          toolName: tool.name,
          content: result.content,
          isError: result.isError,
          timestamp: Date.now(),
        });
        await persistNewMessages();
      }

      // Check and compact the conversation after all tool calls and results
      await compactIfNeeded();
    } else {
      // no tool calls — final response for the current user turn
      newMessages.push({
        type: "message",
        id: crypto.randomUUID(),
        role: "assistant",
        content: turn.parts,
      });
      finalResponse = turn.text;
      lastResult = { message: finalResponse, isError: false };
      await persistNewMessages();

      // If there are pending messages queued while this iteration was running,
      // drain all at once into the next iteration.
      const pending = context.pendingMessages;
      if (pending && pending.length > 0) {
        const toAdd = pending.splice(0);
        for (const msg of toAdd) {
          newMessages.push({
            type: "message",
            id: crypto.randomUUID(),
            role: "user",
            content: [{ type: "text", text: msg }],
            timestamp: Date.now(),
          });
        }
        await compactIfNeeded();
        continue;
      }

      break;
    }
  }

  // Final persist (in case the last turn was just persisted, this is no-op)
  await persistNewMessages();

  return {
    finalResponse: lastResult?.message ?? finalResponse,
    updatedMessages: [...oldMessages, ...savedMessages],
    isError: lastResult?.isError ?? false,
  };
};
