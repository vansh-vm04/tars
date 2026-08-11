import readLine from "node:readline/promises";
import type { Command } from "../types.js";
import type { Agent } from "../agent.js";
import type { SessionManager } from "../session-manager.js";
import { exitCommand } from "./exit.js";
import { newCommand } from "./new.js";
import { modelCommand } from "./model.js";
import { sessionCommand } from "./session.js";
import chalk from "chalk";

const commands = [modelCommand, newCommand, sessionCommand, exitCommand];

export const helpCommand: Command = {
  name: "/help",
  description: "Show available commands",
  async execute(
    _rl: readLine.Interface,
    _agent: Agent,
    _sessionManager?: SessionManager,
  ) {
    console.log(chalk.blueBright("\n\nAvailable commands:\n"));

    for (const command of commands) {
      console.log(`-> ${chalk.green(command.name)} - ${command.description}`);
    }
    console.log(chalk.blueBright("\n\nType a command to execute it.\n"));
  },
};
