import figlet from "figlet";
import chalk from "chalk";

export function showBanner() {
  console.log("\n");

  console.log(
    chalk.hex("#39FF14").bold(
      figlet.textSync("TARS", {
        font: "ANSI Shadow",
        horizontalLayout: "default",
      }),
    ),
  );

  console.log(chalk.dim("\n  Your minimal AI coding agent\n"));
}

export async function startAnimation() {
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

  process.stdout.write("\n");

  for (let i = 0; i < 12; i++) {
    process.stdout.write(
      `\r${chalk.greenBright(frames[i % frames.length])} Initializing TARS...`,
    );

    await new Promise((resolve) => setTimeout(resolve, 80));
  }

  process.stdout.write(
    `\r${chalk.greenBright("✓")} TARS ready!              \n\n`,
  );
}
