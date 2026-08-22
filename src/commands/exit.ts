import type { Command } from "../types.js";

export const exitCommand: Command = {
  name: "/exit",
  description: "Exit the application",
  execute({ onExit }) {
    onExit();
  },
};
