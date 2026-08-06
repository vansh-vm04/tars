import { geminiChat } from "./providers/google-provider.js";
import type { chatInput } from "./types.js";

export const chat = async (input: chatInput, model: string) => {
    if (input) {
        const response = await geminiChat(input, model);
        return response;
    }
}