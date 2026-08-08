import { callLLM } from "./llm.js";
import type { AgentMessage, AssistantMessage, Context } from "./types.js";
import type { GenerateContentResponse } from "@google/genai";

export const runAgentLoop = async (
  model: string,
  newMessages: string[],
  context: Context,
) => {
  let messages: AgentMessage[] = [];
  let tools = context.tools || [];
  let systemPrompt = context.systemPrompt;
  let interaction: GenerateContentResponse | undefined;

  // Add the initial user message to the messages array
  messages.push({
    role: "user",
    content: newMessages.join("\n"),
    timestamp: Date.now(),
  });

  while (true) {
    const LLMResponse = await callLLM({
      model,
      systemPrompt,
      messages,
      tools,
    });

    const toolCalls = LLMResponse?.content.toolCalls || [];
    interaction = LLMResponse?.interaction;

    if (toolCalls.length > 0) {
      messages.push({
        role: "assistant",
        content: interaction!,
        toolCalls: toolCalls.map((toolCall) => ({
          type: "toolCall",
          id: toolCall.id || "",
          name: toolCall.name,
          arguments: toolCall.args,
        })),
      });
      for (const toolCall of toolCalls) {
        const tool = tools.find((t) => t.name === toolCall.name);
        if (!tool) {
          throw new Error(`Tool ${toolCall.name} not found`);
        }
        const toolCallId = toolCall.id || `${tool.name}-${Date.now()}`;
        let result: string[];
        let isError = false;
        try {
          const raw = await tool.execute(toolCall.args);
          result = [typeof raw === "string" ? raw : JSON.stringify(raw)];
        } catch (err) {
          result = [(err as Error).message];
          isError = true;
        }
        messages.push({
          role: "toolResult",
          toolCallId: toolCallId,
          toolName: tool.name,
          content: result,
          isError,
          timestamp: Date.now(),
        });
      }
    } else {
      // no tool calls, return the response
      messages.push({
        role: "assistant",
        content: interaction!,
      });
      break;
    }
  }

  return (messages.at(-1) as AssistantMessage)?.content.candidates?.[0]?.content?.parts?.[0]?.text || "";
};
