import type { Command } from "../types.js";

export const sessionCommand: Command = {
  name: "/session",
  description: "Switch to another session",
  async execute({ agent, ui, setSessions, setOverlay, sessionId }) {
    if (sessionId) {
      if (!agent) {
        ui.addSystemMessage("No active agent.");
        return;
      }
      try {
        await agent.loadSession(String(sessionId).trim());
        ui.clear();
        ui.loadMessages(agent.messagesList);
        ui.addSystemMessage(`Switched to session ${agent.currentSessionName || sessionId}`);
      } catch (e) {
        ui.pushError(String(e));
      }
      return;
    }
    if (!agent) return;
    const all = await agent.allSessions();
    const cwd = process.cwd();
    const matching = all.filter((s) => s.cwd === cwd);
    setSessions(matching);
    setOverlay("session");
  },
};
