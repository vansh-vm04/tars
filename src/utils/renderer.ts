import { marked } from "marked";
import { markedTerminal } from "marked-terminal";
import chalk from "chalk";

marked.use(
  markedTerminal({
    showSectionPrefix: false,
    reflowText: true,
    width: process.stdout.columns ?? 80,
    heading: chalk.hex("#60A5FA").bold, // Bright blue
    firstHeading: chalk.hex("#A78BFA").bold, // Purple
    strong: chalk.hex("#FBBF24").bold, // Amber
    em: chalk.hex("#F472B6").italic, // Pink
    codespan: chalk.hex("#34D399"), // Emerald
    code: chalk.hex("#E5E7EB"), // Light gray
    blockquote: chalk.hex("#A78BFA"), // Purple
    link: chalk.hex("#22D3EE").underline, // Cyan
    href: chalk.hex("#67E8F9"), // Light cyan
    hr: chalk.hex("#6B7280"),
  }) as any,
);

export function renderMarkdown(text: string): string {
  const normalized = text.replace(/\\([*_`#])/g, "$1");
  return marked.parse(normalized) as string;
}
