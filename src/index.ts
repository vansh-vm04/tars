import readLine from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { Agent } from "./agent.js";
import { availableTools } from "./tools/index.js";
import renderMarkdown from "./utils/renderer.js";
import { showBanner, startAnimation } from "./utils/agent-banner.js";
import chalk from "chalk";

const rl = readLine.createInterface({ input, output });

await startAnimation();
showBanner();

const firstMessage = await rl.question(
  chalk.yellowBright("\n\n => How can i help you today? \n\n> "),
);
const agent = new Agent("gemini-3.1-flash-lite", {
  messages: [{ role: "user", content: firstMessage, timestamp: Date.now() }],
  tools: availableTools,
});

const response = await agent.prompt([firstMessage]);

rl.write(`\n\n> ${renderMarkdown(response)}\n\n `);

while (true) {
  const userInput = await rl.question("> ");

  if (userInput === "/exit") {
    break;
  }

  const response = await agent.prompt([userInput]);

  rl.write(`\n\n> ${renderMarkdown(response)}\n\n `);
}

rl.close();
