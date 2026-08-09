import { exec } from "node:child_process";
import { promisify } from "node:util";
import type { BashCommandOutput, Tool } from "../types.js";
import { Type } from "@google/genai";

const execAsync = promisify(exec);

async function runBashCommand(command: string): Promise<BashCommandOutput> {
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stderr) {
      return {
        stdout: stderr.trim(),
        isError: true,
      };
    }
    return {
      stdout: stdout.trim(),
      isError: false,
    };
  } catch (error) {
    throw new Error(`Error executing command "${command}": ${error}`);
  }
}

export const bashTool: Tool = {
  name: "bash",
  description:
    "Execute a shell command in the current working directory. " +
    "Use this to explore files, search the codebase, run programs, " +
    "and perform other shell operations.",
  parameters: {
    command: {
      type: Type.STRING,
      description: "The shell command to execute",
    },
  },
  execute: async (args: Record<string, any>) => {
    const result = await runBashCommand(args.command);
    return {
      content: [result.stdout],
      isError: result.isError,
    };
  },
};
