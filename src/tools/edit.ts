import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Type } from "@google/genai";
import type { Tool } from "../types.js";

export const editTool: Tool = {
  name: "edit",
  description:
    "Edit an existing file by replacing exact text. " +
    "Use this for modifying existing files. " +
    "The oldText must exist exactly once in the file.",

  parameters: {
    path: {
      type: Type.STRING,
      description: "Path of the file to edit, relative to the current working directory.",
    },
    oldText: {
      type: Type.STRING,
      description: "The exact existing text to replace.",
    },
    newText: {
      type: Type.STRING,
      description: "The replacement text.",
    },
  },

  execute: async (args: Record<string, any>) => {
    try {
      const path = resolve(process.cwd(), args.path);

      const content = await readFile(path, "utf8");

      const occurrences = content.split(args.oldText).length - 1;

      if (occurrences === 0) {
        return {
          content: [
            `Error: oldText was not found in ${args.path}. ` +
              "Read the file and use the exact existing text.",
          ],
          isError: true,
        };
      }

      if (occurrences > 1) {
        return {
          content: [
            `Error: oldText occurs ${occurrences} times in ${args.path}. ` +
              "Provide a larger, more specific section so the edit is unambiguous.",
          ],
          isError: true,
        };
      }

      const updated = content.replace(args.oldText, args.newText);

      await writeFile(path, updated, "utf8");

      return {
        content: [`Successfully edited ${args.path}`],
        isError: false,
      };
    } catch (error) {
      return {
        content: [`Error editing ${args.path}: ${error}`],
        isError: true,
      };
    }
  },
};