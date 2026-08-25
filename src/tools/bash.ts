import { exec } from "node:child_process";
import { promisify } from "node:util";
import type { BashCommandOutput, Tool } from "../types.js";
import { Type } from "@google/genai";
import { TOOL_OUTPUT_LIMITS, truncateToolOutput } from "./utils.js";

const execAsync = promisify(exec);

async function runBashCommand(command: string): Promise<BashCommandOutput> {
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: process.cwd(),
      maxBuffer: 10 * 1024 * 1024,
    });

    return {
      stdout: [
        stdout ? `stdout:\n${stdout.trim()}` : "",
        stderr ? `stderr:\n${stderr.trim()}` : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
      isError: false,
    };
  } catch (error: any) {
    return {
      stdout: [
        `Command failed: ${command}`,
        `Exit code: ${error?.code ?? "unknown"}`,
        error?.stdout ? `stdout:\n${error.stdout.trim()}` : "",
        error?.stderr ? `stderr:\n${error.stderr.trim()}` : "",
        error?.message ? `error:\n${error.message}` : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
      isError: true,
    };
  }
}

const BLOCKED_PATTERNS_BUILD: RegExp[] = [
  /\brm\s+(-rf?|--recursive)\b/i,
  /\bgit\s+(reset\s+--hard|clean\s+-[a-z]*f|push|commit)\b/i,
  /\bmkfs\b/i,
  /\bdd\s+if=/i,
  /\bshutdown\b/i,
  /\breboot\b/i,
];

function isDangerousCommand(command: string): boolean {
  return BLOCKED_PATTERNS_BUILD.some((pattern) => pattern.test(command));
}

// --- Plan mode: strict allowlist ---

const PLAN_ALLOWED_PATTERNS: RegExp[] = [
  /^\s*ls(\s|$)/i,
  /^\s*pwd(\s|$)/i,
  /^\s*find(\s|$)/i,
  /^\s*grep(\s|$)/i,
  /^\s*rg(\s|$)/i,
  /^\s*cat(\s|$)/i,
  /^\s*head(\s|$)/i,
  /^\s*tail(\s|$)/i,
  /^\s*sed\s+-n(\s|;|$)/i,
  /^\s*git\s+status(\s|;|$)/i,
  /^\s*git\s+diff(\s|;|$)/i,
  /^\s*git\s+log(\s|;|$)/i,
  /^\s*git\s+branch(\s|;|$)/i,
];

const PLAN_BLOCKED_PATTERNS: RegExp[] = [
  /\brm\b/i,
  /\bmv\b/i,
  /\bcp\b/i,
  /\bmkdir\b/i,
  /\btouch\b/i,
  />/,
  />>/,
  /\bnpm\s+(install|uninstall|i|un)\b/i,
  /\bgit\s+commit\b/i,
  /\bgit\s+push\b/i,
  /\bgit\s+reset\b/i,
  /\bgit\s+clean\b/i,
];

function isPlanModeAllowed(command: string): {
  allowed: boolean;
  reason?: string;
} {
  // Split by shell operators to check each sub-command
  const segments = command
    .split(/\s*(?:&&|\|\||;|\||&)\s*/)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const seg of segments) {
    // First check blocked patterns (more specific error)
    for (const pat of PLAN_BLOCKED_PATTERNS) {
      if (pat.test(seg)) {
        // Provide specific reason
        if (/>/.test(seg))
          return {
            allowed: false,
            reason: "redirection (> , >>) is not allowed in plan mode",
          };
        if (/\brm\b/i.test(seg))
          return { allowed: false, reason: "`rm` is not allowed in plan mode" };
        if (/\bmv\b/i.test(seg))
          return { allowed: false, reason: "`mv` is not allowed in plan mode" };
        if (/\bcp\b/i.test(seg))
          return { allowed: false, reason: "`cp` is not allowed in plan mode" };
        if (/\bmkdir\b/i.test(seg))
          return {
            allowed: false,
            reason: "`mkdir` is not allowed in plan mode",
          };
        if (/\btouch\b/i.test(seg))
          return {
            allowed: false,
            reason: "`touch` is not allowed in plan mode",
          };
        if (/\bnpm\s+(install|uninstall|i|un)\b/i.test(seg))
          return {
            allowed: false,
            reason: "`npm install/uninstall` is not allowed in plan mode",
          };
        if (/\bgit\s+commit\b/i.test(seg))
          return {
            allowed: false,
            reason: "`git commit` is not allowed in plan mode",
          };
        if (/\bgit\s+push\b/i.test(seg))
          return {
            allowed: false,
            reason: "`git push` is not allowed in plan mode",
          };
        if (/\bgit\s+reset\b/i.test(seg))
          return {
            allowed: false,
            reason: "`git reset` is not allowed in plan mode",
          };
        if (/\bgit\s+clean\b/i.test(seg))
          return {
            allowed: false,
            reason: "`git clean` is not allowed in plan mode",
          };
        return {
          allowed: false,
          reason: `command "${seg}" is not allowed in plan mode`,
        };
      }
    }

    const allowed = PLAN_ALLOWED_PATTERNS.some((pat) => pat.test(seg));
    if (!allowed) {
      return {
        allowed: false,
        reason: `"${seg}" is not in the plan-mode allowlist (allowed: ls, pwd, find, grep, rg, cat, head, tail, sed -n, git status/diff/log/branch)`,
      };
    }
  }

  return { allowed: true };
}

function createBashTool(options: {
  mode: "build" | "plan";
  descriptionSuffix?: string;
}): Tool {
  const isPlan = options.mode === "plan";
  const baseDescription =
    "Execute a shell command in the current working directory. " +
    "Use this to explore files, search the codebase, run programs, " +
    "and perform other shell operations." +
    "If the requested output is too large, the result may be truncated.";

  const planDescription =
    " [PLAN MODE — read-only. Allowed: ls, pwd, find, grep, rg, cat, head, tail, sed -n, git status/diff/log/branch. " +
    "Blocked: rm, mv, cp, mkdir, touch, >, >>, npm install/uninstall, git commit/push/reset/clean]";

  return {
    name: "bash",
    description:
      baseDescription +
      (isPlan ? planDescription : "") +
      (options.descriptionSuffix ?? ""),
    parameters: {
      command: {
        type: Type.STRING,
        description: "The shell command to execute",
      },
    },
    execute: async (args: Record<string, any>) => {
      const command: string = String(args.command ?? "");

      if (isPlan) {
        const check = isPlanModeAllowed(command);
        if (!check.allowed) {
          return {
            content: [
              `The command was rejected because the agent was in Plan mode when this tool call was attempted. — ${check.reason}.\n` +
                `Allowed: ls, pwd, find, grep, rg, cat, head, tail, sed -n, git status, git diff, git log, git branch`,
            ],
            isError: true,
          };
        }
      } else {
        if (isDangerousCommand(command)) {
          return {
            content: ["Error: The requested command is not allowed."],
            isError: true,
          };
        }
      }

      const result = await runBashCommand(command);
      return {
        content: [truncateToolOutput(result.stdout, TOOL_OUTPUT_LIMITS.bash)],
        isError: result.isError,
      };
    },
  };
}

export const bashTool: Tool = createBashTool({ mode: "build" });
export const planBashTool: Tool = createBashTool({ mode: "plan" });
