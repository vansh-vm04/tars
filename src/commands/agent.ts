import type { Command } from "../types.js";
import type { AgentMode } from "../types.js";
import { MODE_CONFIG } from "../modes.js";

const VALID_MODES: AgentMode[] = ["build", "plan"];

export const agentCommand: Command = {
  name: "/agent",
  description: "Switch agent mode (build | plan)",
  execute({ agent, ui, setOverlay, agentMode }) {
    if (!agent) {
      ui.addSystemMessage("No active agent.");
      return;
    }

    const current = agent.mode;
    const arg = (agentMode ?? "").trim().toLowerCase() as AgentMode;

    if (!arg) {
      setOverlay("agent");
      return;
    }

    if (!VALID_MODES.includes(arg)) {
      ui.addSystemMessage(`Unknown mode "${arg}". Available: ${VALID_MODES.join(", ")}`);
      return;
    }

    if (arg === current) {
      ui.addSystemMessage(`Already in ${arg} mode.`);
      return;
    }

    agent.mode = arg;
    const tools = MODE_CONFIG[arg].tools.map((t) => t.name).join(", ");
    ui.addSystemMessage(`Switched to ${arg} mode.`);
  },
};
