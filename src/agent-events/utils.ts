import chalk from "chalk";
import type { AgentEvent, StopReason } from "../types.js"

import renderMarkdown from "../utils/renderer.js";

export function handleAgentEvent(event: AgentEvent): void {
  switch (event.type) {
    case "thinking-start":
      process.stdout.write(chalk.dim("\n ⟳ Thinking..."));
      break;
    case "thinking-delta":
      renderMarkdown(event.text);
      break;
    case "thinking-end":
      process.stdout.write(chalk.dim(" ─ done\n"));
      break;
    case "text-start":
      process.stdout.write("\n");
      break;
    case "text-delta":
      renderMarkdown(event.text);
      break;
    case "text-end":
      process.stdout.write("\n");
      break;
    case "tool-call-start":
      process.stdout.write(chalk.cyan(`\n → ${event.name}`));
      break;
    case "tool-call-delta":
      process.stdout.write(chalk.cyan("."));
      break;
    case "tool-call-end":
      process.stdout.write(chalk.cyan(` ─ done\n`));
      break;
    case "finish":
      break;
    case "error":
      process.stdout.write(chalk.redBright("\n\n> "));
      renderMarkdown(event.error.message);
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