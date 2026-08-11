import readLine from "node:readline/promises";
import chalk from "chalk";
import { type Command } from "../types.js";
import { type Agent } from "../agent.js";
import { listSessions, loadSession } from "../storage/session.js";
import { type SessionManager } from "../session-manager.js";

export const sessionCommand: Command = {
  name: "/session",
  description: "Switch to another session",
  async execute(
    rl: readLine.Interface,
    agent: Agent,
    sessionManager: SessionManager,
  ) {
    const sessions = await listSessions();
    const currentCwd = process.cwd();

    const matchingSessions = sessions.filter((s) => s.cwd === currentCwd);

    if (matchingSessions.length === 0) {
      console.log(chalk.yellow("No sessions found for the current directory."));
      return;
    }

    console.log(chalk.greenBright("Select a session (use numbers):"));
    matchingSessions.forEach((s, i) => {
      console.log(
        `${i + 1}. ${s.name} - ${new Date(s.createdAt).toLocaleString()}`,
      );
    });

    const input = await rl.question(
      chalk.greenBright(
        "\nSelect a session number, or press Enter to cancel: ",
      ),
    );

    if (!input.trim()) {
      return;
    }

    const selectedIndex = Number.parseInt(input, 10) - 1;

    if (
      Number.isNaN(selectedIndex) ||
      selectedIndex < 0 ||
      selectedIndex >= matchingSessions.length
    ) {
      console.log(chalk.red("Invalid session selection."));
      return;
    }

    const selectedSession = matchingSessions[selectedIndex]!;
    const loadedSession = await loadSession(selectedSession.id);

    if (!loadedSession) {
      console.log(chalk.red("Unable to load the selected session."));
      return;
    }

    agent.modelName = loadedSession.session.model;
    agent.messagesList = loadedSession.messages;
    sessionManager.currentSession = loadedSession.session;

    console.log(
      chalk.greenBright(
        `Loaded session ${loadedSession.session.name} from ${new Date(
          loadedSession.session.createdAt,
        ).toLocaleString()}`,
      ),
    );
  },
};
