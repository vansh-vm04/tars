import { generatePrompt } from "./utils/system-prompt.js";
import { readTool } from "./tools/read.js";
import { bashTool, planBashTool } from "./tools/bash.js";
import { editTool } from "./tools/edit.js";
import { writeTool } from "./tools/write.js";
import type { Tool } from "./types.js";

const BUILD_TOOLS: Tool[] = [readTool, bashTool, editTool, writeTool];
const PLAN_TOOLS: Tool[] = [readTool, planBashTool];

export const MODE_CONFIG = {
  build: {
    systemPrompt: generatePrompt("build", BUILD_TOOLS),
    tools: BUILD_TOOLS,
  },
  plan: {
    systemPrompt: generatePrompt("plan", PLAN_TOOLS),
    tools: PLAN_TOOLS,
  },
} as const;
