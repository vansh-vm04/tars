import chalk from "chalk";
import type { AgentEvent, StopReason } from "../types.js";

export function handleAgentEvent(event: AgentEvent): void {
  switch (event.type) {
    case "thinking-start":
      process.stdout.write(chalk.dim("\n ⟳ Thinking..."));
      break;
    case "thinking-delta":
      process.stdout.write(chalk.dim(event.text));
      break;
    case "thinking-end":
      process.stdout.write(chalk.dim(" ─ done\n"));
      break;
    case "text-start":
      process.stdout.write("\n");
      break;
    case "text-delta":
      process.stdout.write(event.text);
      break;
    case "text-end":
      process.stdout.write("\n");
      break;
    case "tool-call-start":
      process.stdout.write(
        chalk.dim("\n ⟳ ") + getToolMessage(event.name, event.arguments) + "\n",
      );
      break;
    case "tool-call-end":
      process.stdout.write(
        getToolMessage(event.name, event.arguments) + chalk.green(" ✓\n"),
      );
      break;
    case "finish":
      break;
    case "error":
      process.stdout.write(chalk.redBright("\n\n> "));
      process.stdout.write(event.error);
      process.stdout.write("\n\n ");
      process.stdout.write(
        `> Tip: You can change the model by entering ${chalk.yellowBright("/model")} command.\n\n`,
      );
      break;
  }
}

export const parseArgs = (value: string): Record<string, unknown> => {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

export const mapFinishReason = (reason: string): StopReason => {
  if (/MAX_TOKENS/i.test(reason)) return "length";
  if (/SAFETY|RECITATION|PROHIBITED|BLOCKLIST/i.test(reason)) return "error";
  return "stop";
};

function getToolMessage(
  toolName: string,
  args: Record<string, unknown>,
): string {
  switch (toolName) {
    case "read":
      return `Read ${args.path}...`;

    case "write":
      return `Write ${args.path}...`;

    case "edit":
      return `Edit ${args.path}...`;

    case "bash":
      return `Run ${args.command}...`;

    default:
      return `${toolName}...`;
  }
}