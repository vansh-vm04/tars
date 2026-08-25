import type { Command } from "../types.js";
import { saveConfig } from "../storage/config.js";
import { getAvailableModels } from "../providers/models.js";

export const modelCommand: Command = {
  name: "/model",
  description: "Select the model to use",
  async execute({ agent, ui, setOverlay, model }) {
    if (model) {
      const wanted = String(model).trim().split(/\s+/)[0] ?? "";
      const models = await getAvailableModels();
      const def = models.find((m) => m.id === wanted || m.name === wanted);
      if (!def) {
        ui.addSystemMessage(`Unknown model "${wanted}". Available: ${models.map((m) => m.id).join(", ")}`);
        return;
      }
      await saveConfig({ provider: def.provider, model: def.id });
      if (agent) {
        await agent.setModelName(def.id);
        ui.addSystemMessage(`Model switched to ${def.name} (${def.id})`);
      } else {
        ui.addSystemMessage(`Model set to ${def.name} — will be used on next session.`);
      }
      return;
    }
    setOverlay("model");
  },
};
