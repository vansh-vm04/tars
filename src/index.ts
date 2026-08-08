import readLine from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { Agent } from "./agent.js";
import { availableTools } from "./tools/index.js";
import renderMarkdown from "./utils/renderer.js";

const rl = readLine.createInterface({ input, output });
const firstMessage = await rl.question(
  "\n\n => \x1b[32mHow can i help you today?\x1b[0m \n\n> ",
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
