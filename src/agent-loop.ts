import { callLLM } from "./llm.js";
import type {
  AgentLoopResponse,
  AgentMessage,
  Context,
  LLMResponse,
  Provider,
  ToolExecutionResult,
} from "./types.js";

export const runAgentLoop = async (
  model: string,
  provider: Provider,
  userMessage: string,
  context: Context,
): Promise<AgentLoopResponse> => {
  let initialMessages: AgentMessage[] = context.messages || [];
  let newMessages: AgentMessage[] = [];
  let tools = context.tools || [];
  let systemPrompt = context.systemPrompt;
  let LLMResponse: LLMResponse | undefined;

  // Add the initial user message to the messages array
  newMessages.push({
    role: "user",
    content: [{ type: "text", text: userMessage }],
    timestamp: Date.now(),
  });

  while (true) {
    LLMResponse = await callLLM(provider, {
      model,
      systemPrompt,
      messages: [...initialMessages, ...newMessages],
      tools,
    });

    if (LLMResponse.isError) {
      return {
        finalResponse: LLMResponse.error,
        newMessages,
        isError: true,
      };
    }

    const toolCalls = LLMResponse?.content?.toolCalls || [];

    if (toolCalls.length > 0) {
      newMessages.push({
        role: "assistant",
        content: LLMResponse?.parts ?? [],
      });
      for (const toolCall of toolCalls) {
        const tool = tools.find((t) => t.name === toolCall.name);
        if (!tool) {
          newMessages.push({
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
        newMessages.push({
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
      newMessages.push({
        role: "assistant",
        content: LLMResponse?.parts ?? [],
      });
      break;
    }
  }

  return {
    finalResponse: LLMResponse?.content?.text || "",
    newMessages,
    isError: false,
  };
};
