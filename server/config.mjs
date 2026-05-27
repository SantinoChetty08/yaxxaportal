import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const DEFAULT_API_PORT = 8787;
const DEFAULT_SESSION_DAYS = 7;

function loadEnvFiles() {
  const mode = process.env.NODE_ENV === "production" ? "production" : "development";
  const candidates = [
    ".env",
    `.env.${mode}`,
    ".env.local",
    `.env.${mode}.local`,
  ];

  for (const file of candidates) {
    const fullPath = path.resolve(process.cwd(), file);
    if (!existsSync(fullPath)) continue;

    const contents = readFileSync(fullPath, "utf8");
    for (const rawLine of contents.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const separator = line.indexOf("=");
      if (separator === -1) continue;
      const key = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  }
}

function readNumber(name, fallback) {
  const value = process.env[name];
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readBoolean(name, fallback = false) {
  const value = process.env[name];
  if (!value) return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function loadConfig() {
  loadEnvFiles();
  const nodeEnv = process.env.NODE_ENV ?? "development";
  const isProduction = nodeEnv === "production";

  const dataDb = {
    host: process.env.PORTAL_DB_HOST ?? "",
    port: readNumber("PORTAL_DB_PORT", 3306),
    user: process.env.PORTAL_DB_USER ?? "",
    password: process.env.PORTAL_DB_PASSWORD ?? "",
    database: process.env.PORTAL_DB_NAME ?? "hoducc",
  };

  const authDb = {
    host: process.env.PORTAL_AUTH_DB_HOST ?? dataDb.host,
    port: readNumber("PORTAL_AUTH_DB_PORT", dataDb.port),
    user: process.env.PORTAL_AUTH_DB_USER ?? dataDb.user,
    password: process.env.PORTAL_AUTH_DB_PASSWORD ?? dataDb.password,
    database: process.env.PORTAL_AUTH_DB_NAME ?? dataDb.database,
  };

  const config = {
    nodeEnv,
    isProduction,
    port: readNumber("PORTAL_API_PORT", DEFAULT_API_PORT),
    appOrigin: process.env.PORTAL_APP_ORIGIN ?? "http://127.0.0.1:5173",
    sessionCookieName: process.env.PORTAL_SESSION_COOKIE_NAME ?? "yaxxa_portal_session",
    sessionSecret: process.env.PORTAL_SESSION_SECRET ?? (isProduction ? requireEnv("PORTAL_SESSION_SECRET") : "dev-session-secret-change-me"),
    sessionDays: readNumber("PORTAL_SESSION_DAYS", DEFAULT_SESSION_DAYS),
    trustProxy: readBoolean("PORTAL_TRUST_PROXY", false),
    dataDb,
    authDb,
  };

  return config;
}
