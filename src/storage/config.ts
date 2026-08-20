import { readFile, writeFile, mkdir } from "node:fs/promises";
import chalk from "chalk";
import { CONFIG_FILE, TARS_DIR } from "./path.js";
import readLine from "node:readline/promises";
import type { Config } from "../types.js";
import { getAvailableModels } from "../providers/models.js";
import type { Agent } from "../agent.js";

export async function readConfig(): Promise<Config | null> {
  try {
    const data = await readFile(CONFIG_FILE, "utf8");
    const config: Config = JSON.parse(data);
    if (config && config.model) return config;
    return null;
  } catch {
    return null;
  }
}

export async function saveConfig(config: Config): Promise<void> {
  await mkdir(TARS_DIR, { recursive: true });

  await writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), "utf8");
}

export const askUserForModel = async (
  rl: readLine.Interface,
  agent?: Agent,
): Promise<Config> => {
  const models = await getAvailableModels();

  while (true) {
    const input = await rl.question(
      chalk.greenBright(
        `\n\nSelect a model:\n${models
          .map((model, i) => `${i + 1}. ${model.name} (${model.id})`)
          .join("\n")}\n\n`,
      ),
    );

    const index = Number.parseInt(input, 10) - 1;

    if (index >= 0 && index < models.length) {
      const selectedModel = models[index]!;
      const config: Config = {
        provider: selectedModel.provider,
        model: selectedModel.id,
      };

      await saveConfig(config);

      if (agent) {
        await agent.setModelName(config.model);
      }

      return config;
    }

    rl.write(chalk.red("Invalid model selection. Try again.\n\n> "));
  }
};