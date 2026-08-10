import type { LLMInput, Provider } from "./types.js";

export const callLLM = async (provider: Provider, input: LLMInput) => {
  if (input && provider) {
    const response = await provider.geminiChat(input);
    return response;
  }
  return null;
};
