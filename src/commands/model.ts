import readLine from "node:readline/promises";
import chalk from "chalk";
import { availableModels } from "../providers/index.js";
import type { Command } from "../types.js";
import type { Agent } from "../agent.js";

export const modelCommand: Command = {
  name: "/model",
  description: "Select the model to use",
  async execute(rl: readLine.Interface, agent: Agent) {
    const modelName = await selectModel(rl);

    agent.modelName = modelName;

    console.log(chalk.green(`Model changed to ${modelName}\n\n`));
  },
};

async function selectModel(rl: readLine.Interface): Promise<string> {
  while (true) {
    console.log(
      chalk.greenBright(
        `\nSelect a model:\n${availableModels.google
          .map((model, i) => `${i + 1}. ${model}`)
          .join("\n")}\n\n`,
      ),
    );

    const input = await rl.question("> ");

    const index = Number.parseInt(input, 10) - 1;

    if (index >= 0 && index < availableModels.google.length) {
      return availableModels.google[index]!;
    }

    rl.write(chalk.red("Invalid model selection. Try again.\n\n"));
  }
}
