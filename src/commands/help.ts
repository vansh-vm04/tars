import type { Command } from "../types.js";

export const helpCommand: Command = {
  name: "/help",
  description: "Show available commands",
  execute({ setOverlay }) {
    setOverlay("help");
  },
};
