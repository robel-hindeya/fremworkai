import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import {
  CATS,
  CONVERSATIONS,
  GOALS,
  PROJECTS,
  SOURCES,
  TASKS,
  TRANSACTIONS,
} from "@/lib/data";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "fremwork.sqlite");

let _db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (_db) return _db;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  _db = new DatabaseSync(DB_PATH);
  _db.exec("PRAGMA journal_mode = WAL;");
  _db.exec("PRAGMA synchronous = NORMAL;");

  initSchema(_db);
  seedIfEmpty(_db);

  return _db;
}

function initSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      company TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

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

    CREATE TABLE IF NOT EXISTS data_sources (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      kind TEXT NOT NULL,
      detail TEXT NOT NULL,
      status TEXT NOT NULL,
      message TEXT,
      progress INTEGER,
      updated_at TEXT NOT NULL
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

export function seedIfEmpty(db: DatabaseSync) {
  const txCount = db.prepare("SELECT COUNT(*) as count FROM transactions").get() as { count: number };
  if (txCount.count > 0) return;

  const now = new Date().toISOString();

  // Seed User
  db.prepare(`
    INSERT OR IGNORE INTO users (id, email, password_hash, name, company, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run("usr-1", "selam@harborpine.co", "demo1234", "Selam", "Harbor & Pine Co.", "Owner", now);

  // Seed Transactions
  const insertTx = db.prepare(`
    INSERT INTO transactions (id, name, memo, cat, date, amt, status, method, note, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const t of TRANSACTIONS) {
    insertTx.run(t.id, t.name, t.memo, t.cat, t.date, t.amt, t.status, t.method, null, now);
  }

  // Seed Budgets
  const insertBudget = db.prepare(`
    INSERT INTO budgets (id, k, oct, sep, budget, owner, alert, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (let i = 0; i < CATS.length; i++) {
    const c = CATS[i];
    insertBudget.run(`b-${i + 1}`, c.k, c.oct, c.sep, c.budget, c.owner, "90% of budget", now);
  }

  // Seed Goals
  const insertGoal = db.prepare(`
    INSERT INTO goals (id, type, name, cur, target, start, date, down, status, ai, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const g of GOALS) {
    insertGoal.run(g.id, g.type, g.name, g.cur, g.target, g.start, g.date, g.down ? 1 : 0, g.status, g.ai, now);
  }

  // Seed Projects
  const insertProj = db.prepare(`
    INSERT INTO projects (id, name, desc, chats_json, docs_json, reports_json, updated, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const p of PROJECTS) {
    insertProj.run(
      p.id,
      p.name,
      p.desc,
      JSON.stringify(p.chats),
      JSON.stringify(p.docs),
      JSON.stringify(p.reports),
      p.updated,
      now
    );
  }

  // Seed Tasks
  const insertTask = db.prepare(`
    INSERT INTO tasks (id, name, prompt, freq, next_run, last_run, last_failed, is_on, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const t of TASKS) {
    insertTask.run(t.id, t.name, t.prompt, t.freq, t.next, t.last, t.lastFailed ? 1 : 0, t.on ? 1 : 0, now);
  }

  // Seed Data Sources
  const insertSource = db.prepare(`
    INSERT INTO data_sources (id, name, kind, detail, status, message, progress, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const s of SOURCES) {
    insertSource.run(s.id, s.name, s.kind, s.detail, s.status, s.message || null, s.progress || null, now);
  }

  // Seed Conversations & Messages
  const insertConvo = db.prepare(`
    INSERT INTO conversations (id, title, project_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertMsg = db.prepare(`
    INSERT INTO messages (id, conversation_id, role, kind, mode, status, text, file_name, files_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const c of CONVERSATIONS) {
    insertConvo.run(c.id, c.title, null, now, now);
    insertMsg.run(`${c.id}-q`, c.id, "user", null, null, "done", c.q, null, "[]", now);
    insertMsg.run(`${c.id}-a`, c.id, "ai", c.kind, "Balanced", "done", null, null, "[]", now);
  }
}
