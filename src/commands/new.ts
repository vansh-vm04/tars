import type { Command } from "../types.js";

export const newCommand: Command = {
  name: "/new",
  description: "Start a new session",
  execute({ agent, ui }) {
    ui.clear();
    if (agent) {
      agent.clearSession();
    }
  },
};
