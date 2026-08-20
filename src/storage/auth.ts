import { readFile, writeFile, mkdir } from "node:fs/promises";
import type { AuthConfig } from "../types.js";
import { AUTH_FILE, TARS_DIR } from "./path.js";

export async function readAuth(): Promise<AuthConfig | null> {
  try {
    const data = await readFile(AUTH_FILE, "utf8");
    const auth: AuthConfig = JSON.parse(data);
    if (auth && auth.apiKey) return auth;
    return null;
  } catch {
    return null;
  }
}

export async function saveAuth(auth: AuthConfig): Promise<void> {
  await mkdir(TARS_DIR, { recursive: true });

  await writeFile(AUTH_FILE, JSON.stringify(auth, null, 2), "utf8");
}