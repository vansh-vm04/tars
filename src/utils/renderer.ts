import { marked } from "marked";
import { markedTerminal } from "marked-terminal";

marked.use(
  markedTerminal({
    showSectionPrefix: false,
    reflowText: true,
    width: process.stdout.columns ?? 80,
  }) as any,
);

export function renderMarkdown(text: string): string {
  const normalized = text.replace(/\\([*_`#])/g, "$1");
  return marked.parse(normalized) as string;
}
