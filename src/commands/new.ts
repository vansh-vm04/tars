import chalk from "chalk";
import readLine from "node:readline/promises";
import type { Agent } from "../agent.js";
import type { Command } from "../types.js";
import type { SessionManager } from "../session-manager.js";

export const newCommand: Command = {
	name: "/new",
	description: "Start a new session",
	async execute(
		_rl: readLine.Interface,
		agent: Agent,
		sessionManager?: SessionManager,
	) {
		agent.messagesList = [];

		if (sessionManager) {
			sessionManager.currentSession = undefined;
		}

		console.log(chalk.greenBright("Started a new session."));
	},
};
