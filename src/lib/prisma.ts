import "dotenv/config";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { PrismaBetterSQLite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";

const defaultDbDir = "data";
const defaultDbPath = `${defaultDbDir}/jscalendar-tasks.db`;

/**
 * Resolves DATABASE_URL into the connection string Prisma should use at runtime.
 */
function resolveConnectionString() {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    mkdirSync(defaultDbDir, { recursive: true });
    return `file:${defaultDbPath}`;
  }
  ensureFileDatabaseDir(raw);
  return raw;
}

/**
 * Creates the parent directory for SQLite file URLs before Prisma connects.
 */
function ensureFileDatabaseDir(url: string) {
  if (!url.startsWith("file:")) return;
  const dbPath = url.slice("file:".length);
  if (!dbPath || dbPath === ":memory:") return;
  const parent = dirname(dbPath);
  if (!parent || parent === ".") return;
  mkdirSync(parent, { recursive: true });
}

const connectionString = resolveConnectionString();
const adapter = new PrismaBetterSQLite3({ url: connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };
