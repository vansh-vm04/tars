import os from "node:os";
import path from "node:path";

export const TARS_DIR = path.join(os.homedir(), ".tars");

export const AUTH_FILE = path.join(TARS_DIR, "auth.json");
export const CONFIG_FILE = path.join(TARS_DIR, "config.json");
export const SESSIONS_DIR = path.join(TARS_DIR, "sessions");