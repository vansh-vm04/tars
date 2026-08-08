import { geminiChat } from "./providers/google-provider.js";
import type { LLMInput } from "./types.js";

export const callLLM = async (input: LLMInput) => {
    if (input) {
        const response = await geminiChat(input);
        return response;
    }
    return null;
}