import { callLLMStream } from "./llm.js";
import type {
  AgentLoopContext,
  AgentLoopResponse,
  SessionMessageEntry,
  ToolExecutionResult,
} from "./types.js";
import { toAgentMessage } from "./utils/common.js";
import { AgentEventStream } from "./agent-events/stream.js";
import chalk from "chalk";

export const runAgentLoop = async (
  context: AgentLoopContext,
): Promise<AgentLoopResponse> => {
  let oldMessages: SessionMessageEntry[] = context.messages || [];
  let newMessages: SessionMessageEntry[] = [];
  const tools = context.tools || [];
  const { model, provider, userMessage, systemPrompt, onEvent } = context;

  const toAgentMessages = (entries: SessionMessageEntry[]) =>
    entries.map(toAgentMessage);

  const allMessages = () => [...oldMessages, ...newMessages];

  const compactIfNeeded = async () => {
    const messages = allMessages();
    if (!context.shouldCompact(messages)) return;
    console.log(chalk.yellowBright("\n\n => Compacting conversation...\n\n"));
    const result = await context.compact(messages);
    if (newMessages.length > 0) {
      await context.saveMessage(newMessages);
    }
    await context.saveMessage([result.compactionEntry]);
    oldMessages = result.updatedMessages;
    newMessages = [];
  };

  const persistNewMessages = async (): Promise<SessionMessageEntry[]> => {
    if (newMessages.length === 0) return [];
    const saved = await context.saveMessage(newMessages);
    newMessages = [];
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

  while (true) {
    const turn = await streamTurn();

    if (turn.isError) {
      const savedMessages = await persistNewMessages();
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
      }

      // Check and compact the conversation after all tool calls and results
      await compactIfNeeded();
    } else {
      // no tool calls, return the response
      newMessages.push({
        type: "message",
        id: crypto.randomUUID(),
        role: "assistant",
        content: turn.parts,
      });
      finalResponse = turn.text;
      break;
    }
  }

  const savedMessages = await persistNewMessages();

  return {
    finalResponse,
    updatedMessages: [...oldMessages, ...savedMessages],
    isError: false,
  };
};