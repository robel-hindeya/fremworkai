import { getDb } from "../db";
import type { Goal } from "@/lib/data";

export interface GoalRecord extends Goal {
  created_at?: string;
}

export const GoalsRepo = {
  getAll(): GoalRecord[] {
    const db = getDb();
    const rows = db.prepare("SELECT * FROM goals ORDER BY created_at ASC").all() as any[];
    return rows.map((r) => ({
      id: r.id,
      type: r.type,
      name: r.name,
      cur: Number(r.cur),
      target: Number(r.target),
      start: Number(r.start),
      date: r.date,
      down: Boolean(r.down),
      status: r.status,
      ai: r.ai,
      created_at: r.created_at,
    }));
  },

  create(data: { type: string; name: string; cur: number; target: number; start?: number; date: string; down?: boolean }): GoalRecord {
    const db = getDb();
    const id = `g-${Date.now().toString(36)}`;
    const now = new Date().toISOString();
    const start = data.start ?? data.cur;
    const down = data.down ?? (data.type === "Expense reduction");
    const ai = `Goal established. Tracking pace toward ${data.type.toLowerCase()} of $${data.target.toLocaleString()} by ${data.date}.`;

    db.prepare(`
      INSERT INTO goals (id, type, name, cur, target, start, date, down, status, ai, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.type, data.name, data.cur, data.target, start, data.date, down ? 1 : 0, "On track", ai, now);

    const r = db.prepare("SELECT * FROM goals WHERE id = ?").get(id) as any;
    return {
      id: r.id,
      type: r.type,
      name: r.name,
      cur: Number(r.cur),
      target: Number(r.target),
      start: Number(r.start),
      date: r.date,
      down: Boolean(r.down),
      status: r.status,
      ai: r.ai,
      created_at: r.created_at,
    };
  },

  update(id: string, patch: Partial<GoalRecord>): GoalRecord | null {
    const db = getDb();
    const current = db.prepare("SELECT * FROM goals WHERE id = ?").get(id) as any;
    if (!current) return null;

    const updated = { ...current, ...patch };
    db.prepare(`
      UPDATE goals
      SET type = ?, name = ?, cur = ?, target = ?, start = ?, date = ?, down = ?, status = ?, ai = ?
      WHERE id = ?
    `).run(
      updated.type,
      updated.name,
      updated.cur,
      updated.target,
      updated.start,
      updated.date,
      updated.down ? 1 : 0,
      updated.status,
      updated.ai,
      id
    );

    const r = db.prepare("SELECT * FROM goals WHERE id = ?").get(id) as any;
    return {
      id: r.id,
      type: r.type,
      name: r.name,
      cur: Number(r.cur),
      target: Number(r.target),
      start: Number(r.start),
      date: r.date,
      down: Boolean(r.down),
      status: r.status,
      ai: r.ai,
      created_at: r.created_at,
    };
  },

  delete(id: string): boolean {
    const db = getDb();
    const res = db.prepare("DELETE FROM goals WHERE id = ?").run(id);
    return res.changes > 0;
  },
};
