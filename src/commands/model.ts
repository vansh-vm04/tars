import readLine from "node:readline/promises";
import chalk from "chalk";
import type { Command } from "../types.js";
import type { Agent } from "../agent.js";
import { askUserForModel } from "../storage/config.js";
import type { SessionManager } from "../session-manager.js";

export const modelCommand: Command = {
  name: "/model",
  description: "Select the model to use",
  async execute(rl: readLine.Interface, agent: Agent, sessionManager: SessionManager) {
    const config = await askUserForModel(rl, sessionManager);

    agent.modelName = config.model;

    console.log(chalk.green(`Model changed to ${config.model}\n\n`));
  },
};
