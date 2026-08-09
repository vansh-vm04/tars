import { readFile, writeFile, mkdir } from "node:fs/promises";
import type { AuthConfig } from "../types.js";
import chalk from "chalk";
import { AUTH_FILE, TARS_DIR } from "./path.js";
import readLine from "node:readline/promises";

export async function loadAuth(rl: readLine.Interface): Promise<AuthConfig> {
  try {
    const data = await readFile(AUTH_FILE, "utf8");
    const auth: AuthConfig = JSON.parse(data);
    if (!auth) {
      return await askUserForAuth(rl);
    }
    return auth;
  } catch {
    return await askUserForAuth(rl);
  }
}

async function askUserForAuth(rl: readLine.Interface) {
  const apiKey = await rl.question(
    chalk.greenBright("\n\n> Enter your Google API key to continue: "),
  );
  await saveAuth({ provider: "google", apiKey });
  return { provider: "google", apiKey };
}

export async function saveAuth(auth: AuthConfig): Promise<void> {
  await mkdir(TARS_DIR, { recursive: true });

  await writeFile(AUTH_FILE, JSON.stringify(auth, null, 2), "utf8");
}
