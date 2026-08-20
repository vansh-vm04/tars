import type { StopReason } from "../types.js";

export function parseArgs(value: string): Record<string, unknown> {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

export const mapFinishReason = (reason: string): StopReason => {
  if (/MAX_TOKENS/i.test(reason)) return "length";
  if (/SAFETY|RECITATION|PROHIBITED|BLOCKLIST/i.test(reason)) return "error";
  return "stop";
};