import { callLLM } from "./llm.js";
import type {
  AgentMessage,
  Context,
  LLMResponse,
  Provider,
  ToolExecutionResult,
} from "./types.js";

export const runAgentLoop = async (
  model: string,
  provider: Provider,
  initialMessages: AgentMessage[],
  newMessages: string[],
  context: Context,
) => {
  let messages: AgentMessage[] = initialMessages;
  let tools = context.tools || [];
  let systemPrompt = context.systemPrompt;
  let LLMResponse: LLMResponse | undefined;

  // Add the initial user message to the messages array
  messages.push({
    role: "user",
    content: [{ type: "text", text: newMessages.join("\n") }],
    timestamp: Date.now(),
  });

  while (true) {
    LLMResponse = await callLLM(provider, {
      model,
      systemPrompt,
      messages,
      tools,
    });

    if (LLMResponse.isError) {
      return {
        finalResponse: LLMResponse.error,
        messages,
        isError: true,
      };
    }

    const toolCalls = LLMResponse?.content?.toolCalls || [];

    if (toolCalls.length > 0) {
      messages.push({
        role: "assistant",
        content: LLMResponse?.parts ?? [],
      });
      for (const toolCall of toolCalls) {
        const tool = tools.find((t) => t.name === toolCall.name);
        if (!tool) {
          messages.push({
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
          result = await tool.execute(toolCall.args);
        } catch (err) {
          result = {
            content: [
              `Error executing tool "${toolCall.name}": ${(err as Error).message}`,
            ],
            isError: true,
          };
        }
        messages.push({
          role: "toolResult",
          toolCallId: toolCallId,
          toolName: tool.name,
          content: result.content,
          isError: result.isError,
          timestamp: Date.now(),
        });
      }
    } else {
      // no tool calls, return the response
      messages.push({
        role: "assistant",
        content: LLMResponse?.parts ?? [],
      });
      break;
    }
  }

  return {
    finalResponse: LLMResponse?.content?.text || "",
    messages,
    isError: false,
  };
};
