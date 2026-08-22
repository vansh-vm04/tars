import type { Command } from "../types.js";

export const modelCommand: Command = {
  name: "/model",
  description: "Select the model to use",
  execute({ setOverlay }) {
    setOverlay("model");
  },
};
