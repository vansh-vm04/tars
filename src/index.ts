import readLine from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { Agent } from "./agent.js";
import { availableTools } from "./tools/index.js";
import { showBanner, startAnimation } from "./utils/agent-banner.js";
import chalk from "chalk";
import { loadAuth } from "./storage/auth.js";
import { GoogleProvider } from "./providers/google-provider.js";
import { loadConfig } from "./storage/config.js";
import { availableCommands } from "./commands/index.js";
import { handleAgentEvent } from "./agent-events/utils.js";

const rl = readLine.createInterface({ input, output });

await startAnimation();
showBanner();

const auth = await loadAuth(rl);
const config = await loadConfig(rl);

const provider = new GoogleProvider(auth.apiKey);

const agent = new Agent(
  config.model,
  {
    messages: [],
    tools: availableTools,
  },
  provider,
);

agent.onEvent(handleAgentEvent);
console.log(chalk.yellowBright("\n\n => How can i help you today? \n\n"));

while (true) {
  const userInput = (await rl.question("> ")).trim();

  if (!userInput) {
    continue;
  }

  if (userInput.startsWith("/")) {
    const command = availableCommands.find(
      (cmd) => cmd.name == userInput,
    );

    if (command) {
      await command.execute(rl, agent);
      if (command.name === "/exit") break;
      continue;
    }
  }

  const response = await agent.prompt(userInput);

  // Output is streamed live via agent events handled by handleAgentEvent.
  // No terminal output is done here.
  void response;
}
