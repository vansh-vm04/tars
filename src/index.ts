import readLine from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { Agent } from "./agent.js";
import { availableTools } from "./tools/index.js";
import renderMarkdown from "./utils/renderer.js";
import { showBanner, startAnimation } from "./utils/agent-banner.js";
import chalk from "chalk";
import { loadAuth } from "./storage/auth.js";
import { GoogleProvider } from "./providers/google-provider.js";

const rl = readLine.createInterface({ input, output });

await startAnimation();
showBanner();

const auth = await loadAuth(rl);

const provider = new GoogleProvider(auth.apiKey);

const agent = new Agent(
  "gemini-3.1-flash-lite",
  {
    messages: [],
    tools: availableTools,
  },
  provider,
);

const firstMessage = await rl.question(
  chalk.yellowBright("\n\n => How can i help you today? \n\n> "),
);

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
