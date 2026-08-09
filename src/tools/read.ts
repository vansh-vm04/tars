import { readFile } from "node:fs/promises";
import type { Tool } from "../types.js";
import { Type } from "@google/genai";

export const readTool: Tool = {
  name: "read",
  description: "Read the contents of a file. Supports text files only.",
  parameters: {
    path: {
      type: Type.STRING,
      description: "The path to the file to read.",
    },
  },
  execute: async (args: Record<string, any>) => {
    const path = args.path;
    return new Promise((resolve, reject) => {
      readFile(path, "utf8")
        .then((data) => resolve({ content: data.split("\n"), isError: false }))
        .catch((err) =>
          reject({
            content: [`Error reading file: ${err.message}`],
            isError: true,
          }),
        );
    });
  },
};
