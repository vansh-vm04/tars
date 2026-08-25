import { BUILD_SYSTEM_PROMPT, PLAN_SYSTEM_PROMPT } from "./utils/system-prompt.js";
import { readTool } from "./tools/read.js";
import { bashTool } from "./tools/bash.js";
import { editTool } from "./tools/edit.js";
import { writeTool } from "./tools/write.js";
import type { Tool } from "./types.js";

const BUILD_TOOLS: Tool[] = [readTool, bashTool, editTool, writeTool];
const PLAN_TOOLS: Tool[] = [readTool, bashTool];

export const MODE_CONFIG = {
  build: {
    systemPrompt: BUILD_SYSTEM_PROMPT,
    tools: BUILD_TOOLS,
  },
  plan: {
    systemPrompt: PLAN_SYSTEM_PROMPT,
    tools: PLAN_TOOLS,
  },
} as const;
