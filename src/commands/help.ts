import readLine from "node:readline/promises";
import type { Command } from "../types.js";
import type { Agent } from "../agent.js";
import { availableCommands } from "./index.js";
import chalk from "chalk";

export const helpCommand: Command = {
  name: "/help",
  description: "Show available commands",
  async execute(
    _rl: readLine.Interface,
    _agent: Agent,
  ) {
    console.log(chalk.blueBright("\n\nAvailable commands:\n"));

    for (const command of availableCommands) {
      console.log(`-> ${chalk.green(command.name)} - ${command.description}`);
    }
    console.log(chalk.blueBright("\n\nType a command to execute it.\n"));
  },
};
