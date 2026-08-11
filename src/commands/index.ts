import type { Command } from "../types.js";
import { exitCommand } from "./exit.js";
import { modelCommand } from "./model.js";
import { sessionCommand } from "./session.js";

export const availableCommands: Command[] = [
  modelCommand,
  sessionCommand,
  exitCommand,
];
