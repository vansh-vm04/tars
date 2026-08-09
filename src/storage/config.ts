import { readFile, writeFile, mkdir } from "node:fs/promises";
import chalk from "chalk";
import { CONFIG_FILE, TARS_DIR } from "./path.js";
import readLine from "node:readline/promises";
import type { Config } from "../types.js";
import { availableModels } from "../providers/index.js";

export async function loadConfig(rl: readLine.Interface): Promise<Config> {
  try {
    const data = await readFile(CONFIG_FILE, "utf8");
    const config: Config = JSON.parse(data);
    if (!config) {
      return await askUserForModel(rl);
    }
    return config;
  } catch {
    return await askUserForModel(rl);
  }
}

async function askUserForModel(rl: readLine.Interface): Promise<Config> {
  while (true) {
    const input = await rl.question(
      chalk.greenBright(
        `\n\nSelect a model:\n${availableModels.google
          .map((model, i) => `${i + 1}. ${model}`)
          .join("\n")}\n\n`,
      ),
    );

    const index = Number.parseInt(input, 10) - 1;

    if (index >= 0 && index < availableModels.google.length) {
      const config: Config = {
        provider: "google",
        model: availableModels.google[index]!,
      };

      await saveConfig(config);

      return config;
    }

    rl.write(chalk.red("Invalid model selection. Try again.\n\n> "));
  }
}

async function saveConfig(config: Config): Promise<void> {
  await mkdir(TARS_DIR, { recursive: true });

  await writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), "utf8");
}
