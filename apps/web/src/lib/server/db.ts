import { AsyncLocalStorage } from "node:async_hooks";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Vercel's app folder is read-only, so only the temp folder is writable there.
// Temp storage is wiped when the server instance restarts.
const DATA_DIR = process.env.VERCEL ? path.join(os.tmpdir(), "fremwork") : path.join(process.cwd(), "data");

/** The signed-in user for the current request. Each user has their own database file. */
export const userScope = new AsyncLocalStorage<string>();

const databases = new Map<string, DatabaseSync>();

export function getDb(): DatabaseSync {
  const userId = userScope.getStore();
  if (!userId) throw new Error("No signed-in user for this request.");

  const existing = databases.get(userId);
  if (existing) return existing;

  fs.mkdirSync(DATA_DIR, { recursive: true });

  const db = new DatabaseSync(path.join(DATA_DIR, `user-${userId.replace(/[^a-zA-Z0-9-]/g, "")}.sqlite`));
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA synchronous = NORMAL;");
  initSchema(db);

  databases.set(userId, db);
  return db;
}

function initSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      memo TEXT NOT NULL,
      cat TEXT NOT NULL,
      date TEXT NOT NULL,
      amt REAL NOT NULL,
      status TEXT NOT NULL,
      method TEXT NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_cat ON transactions(cat);
    CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      k TEXT UNIQUE NOT NULL,
      oct REAL NOT NULL,
      sep REAL NOT NULL,
      budget REAL NOT NULL,
      owner TEXT NOT NULL,
      alert TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      cur REAL NOT NULL,
      target REAL NOT NULL,
      start REAL NOT NULL,
      date TEXT NOT NULL,
      down INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL,
      ai TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      desc TEXT NOT NULL,
      chats_json TEXT NOT NULL DEFAULT '[]',
      docs_json TEXT NOT NULL DEFAULT '[]',
      reports_json TEXT NOT NULL DEFAULT '[]',
      updated TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      prompt TEXT NOT NULL,
      freq TEXT NOT NULL,
      next_run TEXT NOT NULL,
      last_run TEXT NOT NULL,
      last_failed INTEGER NOT NULL DEFAULT 0,
      is_on INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      project_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL,
      kind TEXT,
      mode TEXT,
      status TEXT NOT NULL,
      text TEXT,
      file_name TEXT,
      files_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_messages_convo ON messages(conversation_id);
  `);
}
