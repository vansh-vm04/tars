import { exec } from "node:child_process";
import { promisify } from "node:util";
import type { BashCommandOutput, Tool } from "../types.js";
import { Type } from "@google/genai";
import { TOOL_OUTPUT_LIMITS, truncateToolOutput } from "./utils.js";

const execAsync = promisify(exec);

async function runBashCommand(command: string): Promise<BashCommandOutput> {
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: process.cwd(),
      maxBuffer: 10 * 1024 * 1024,
    });

    return {
      stdout: [
        stdout ? `stdout:\n${stdout.trim()}` : "",
        stderr ? `stderr:\n${stderr.trim()}` : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
      isError: false,
    };
  } catch (error: any) {
    return {
      stdout: [
        `Command failed: ${command}`,
        `Exit code: ${error?.code ?? "unknown"}`,
        error?.stdout ? `stdout:\n${error.stdout.trim()}` : "",
        error?.stderr ? `stderr:\n${error.stderr.trim()}` : "",
        error?.message ? `error:\n${error.message}` : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
      isError: true,
    };
  }
}

export const bashTool: Tool = {
  name: "bash",
  description:
    "Execute a shell command in the current working directory. " +
    "Use this to explore files, search the codebase, run programs, " +
    "and perform other shell operations." +
    "If the requested output is too large, the result may be truncated.",
  parameters: {
    command: {
      type: Type.STRING,
      description: "The shell command to execute",
    },
  },
  execute: async (args: Record<string, any>) => {
    if (isDangerousCommand(args.command)) {
      return {
        content: ["Error: The requested command is not allowed."],
        isError: true,
      };
    }
    const result = await runBashCommand(args.command);
    return {
      content: [truncateToolOutput(result.stdout, TOOL_OUTPUT_LIMITS.bash)],
      isError: result.isError,
    };
  },
};

const BLOCKED_PATTERNS = [
  /\brm\s+(-rf?|--recursive)\b/i,
  /\bgit\s+(reset\s+--hard|clean\s+-[a-z]*f|push|commit)\b/i,
  /\bmkfs\b/i,
  /\bdd\s+if=/i,
  /\bshutdown\b/i,
  /\breboot\b/i,
];

function isDangerousCommand(command: string): boolean {
  return BLOCKED_PATTERNS.some((pattern) => pattern.test(command));
}
