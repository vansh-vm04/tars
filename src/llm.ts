import { geminiChat } from "./providers/google-provider.js";
import type { chatInput, LLMInput } from "./types.js";

export const chat = async (input: LLMInput) => {
    if (input) {
        const response = await geminiChat(input);
        return response;
    }
    return null;
}