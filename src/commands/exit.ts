import readLine from "node:readline/promises";
import chalk from "chalk";
import type { Command } from "../types.js";
import type { Agent } from "../agent.js";

export const exitCommand: Command = {
  name: "/exit",
  description: "Exit the application",
  async execute(rl: readLine.Interface, agent: Agent) {
    console.log(chalk.green("Exiting..."));
    rl.close();
  },
};
