import chalk from "chalk";
import readLine from "node:readline/promises";
import type { Agent } from "../agent.js";
import type { Command } from "../types.js";

export const newCommand: Command = {
  name: "/new",
  description: "Start a new session",
  async execute(_rl: readLine.Interface, agent: Agent) {
    agent.clearSession();

    console.log(chalk.greenBright("Started a new session."));
  },
};
