import type { GoogleProvider } from "./providers/google-provider.js";
import type { LLMInput } from "./types.js";

export const callLLM = async (provider: GoogleProvider, input: LLMInput) => {
  if (input && provider) {
    const response = await provider.geminiChat(input);
    return response;
  }
  return null;
};
