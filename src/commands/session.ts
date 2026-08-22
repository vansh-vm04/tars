import type { Command } from "../types.js";

export const sessionCommand: Command = {
  name: "/session",
  description: "Switch to another session",
  async execute({ agent, setSessions, setOverlay }) {
    if (!agent) return;
    const all = await agent.allSessions();
    const cwd = process.cwd();
    const matching = all.filter((s) => s.cwd === cwd);
    setSessions(matching);
    setOverlay("session");
  },
};
