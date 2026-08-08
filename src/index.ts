import { runAgentLoop } from "./agent-loop.js";
import { readTool } from "./tools/read.js";
import { renderMarkdown } from "./utils/renderer.js";
import { SYSTEM_PROMPT } from "./utils/system-prompt.js";

const context = {
  systemPrompt: SYSTEM_PROMPT,
  messages: [],
  tools: [readTool],
};

const result = await runAgentLoop(
  "gemini-3.5-flash-lite",
  ["Read file tsconfig.json and provide a summary of what it does in this project. After that do same for ./src/index.ts file."],
  context,
);

process.stdout.write(renderMarkdown(result));