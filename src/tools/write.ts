import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Type } from "@google/genai";
import type { Tool } from "../types.js";

export const writeTool: Tool = {
  name: "write",
  description:
    "Write content directly to a file. Creates the file if it does not exist, " +
    "or overwrites it if it does. Use this for creating or completely replacing files.",
  parameters: {
    path: {
      type: Type.STRING,
      description:
        "Path of the file, relative to the current working directory.",
    },
    content: {
      type: Type.STRING,
      description: "The complete content to write to the file.",
    },
  },

  execute: async (args: Record<string, any>) => {
    try {
      const path = resolve(process.cwd(), args.path);

      await writeFile(path, args.content, "utf8");

      return {
        content: [`Successfully wrote ${args.path}`],
        isError: false,
      };
    } catch (error: any) {
      return {
        content: [
          `Failed to write file: ${args.path}`,
          `Resolved path: ${resolve(process.cwd(), args.path)}`,
          `Error code: ${error?.code ?? "unknown"}`,
          `Error message: ${error?.message ?? String(error)}`,
        ],
        isError: true,
      };
    }
  },
};