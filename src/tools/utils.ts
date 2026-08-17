export const TOOL_OUTPUT_LIMITS = {
  read: 20_000,
  bash: 12_000,
};

export function truncateToolOutput(output: string, maxChars = 12_000): string {
  if (output.length <= maxChars) return output;

  const head = Math.floor(maxChars * 0.5);
  const tail = maxChars - head;

  return `${output.slice(0, head)}

[... output truncated ...]

${output.slice(-tail)}

[Tool output was truncated. Retrieve a narrower output if needed.]`;
}
