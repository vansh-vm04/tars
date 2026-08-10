import type { Command } from "../types.js";
import { exitCommand } from "./exit.js";
import { modelCommand } from "./model.js";

export const availableCommands: Command[] = [modelCommand, exitCommand];
