import readLine from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { Agent } from "./agent.js";
import { availableTools } from "./tools/index.js";
import renderMarkdown from "./utils/renderer.js";
import { showBanner, startAnimation } from "./utils/agent-banner.js";
import chalk from "chalk";
import { loadAuth } from "./storage/auth.js";
import { GoogleProvider } from "./providers/google-provider.js";
import { loadConfig } from "./storage/config.js";
import { availableCommands } from "./commands/index.js";

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

console.log(chalk.yellowBright("\n\n => How can i help you today? \n\n"));

while (true) {
  const userInput = (await rl.question("> ")).trim();

  if (!userInput) {
    continue;
  }

  if (userInput.trim().startsWith("/")) {
    const command = availableCommands.find(
      (cmd) => cmd.name == userInput.trim(),
    );

    if (command) {
      await command.execute(rl, agent);
      if (command.name === "/exit") break;
      continue;
    }
  }

  const response = await agent.prompt(userInput);

  if (response.isError) {
    console.log(chalk.redBright(`\n\n> ${response.message}\n\n `));
    console.log(
      `> Tip: You can change the model by entering ${chalk.yellowBright("/model")} command.\n\n`,
    );
    continue;
  }

  console.log(`\n\n> ${renderMarkdown(response.message)}\n\n `);
}
