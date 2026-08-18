import { readFile } from "node:fs/promises";
import type { Tool } from "../types.js";
import { Type } from "@google/genai";
import { TOOL_OUTPUT_LIMITS, truncateToolOutput } from "./utils.js";

export const readTool: Tool = {
  name: "read",
  description:
    "Read the contents of a file. Supports text files only. " +
    "Optionally provide offset and limit to read a specific line range of the file." +
    "If the requested output is too large, the result may be truncated.",
  parameters: {
    path: {
      type: Type.STRING,
      description: "The path to the file to read.",
    },
    offset: {
      type: Type.INTEGER,
      description:
        "The 1-indexed line to start reading from. Use with limit to read a specific portion of a large file.",
    },
    limit: {
      type: Type.INTEGER,
      description:
        "The maximum number of lines to read. Combined with offset, read a file in chunks that fit within the output limit.",
    },
  },
  execute: async (args: Record<string, any>) => {
    const path = args.path;
    const offset = args.offset;
    const limit = args.limit;
    return new Promise((resolve, reject) => {
      readFile(path, "utf8")
        .then((data) => {
          let output = data;
          if (typeof offset === "number" || typeof limit === "number") {
            const lines = data.split("\n");
            const start =
              typeof offset === "number" && offset > 0 ? offset - 1 : 0;
            const end = typeof limit === "number" ? start + limit : undefined;
            output = lines.slice(start, end).join("\n");
          }
          resolve({
            content: [truncateToolOutput(output, TOOL_OUTPUT_LIMITS.read)],
            isError: false,
          });
        })
        .catch((err: NodeJS.ErrnoException) =>
          reject({
            content: [
              `Error reading file "${path}": ${err.code ?? "unknown error"}${
                err.message ? ` - ${err.message}` : ""
              }`,
            ],
            isError: true,
          }),
        );
    });
  },
};
