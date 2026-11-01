import { getDb } from "../db";
import type { BudgetCat } from "@/lib/data";

export interface BudgetRecord extends BudgetCat {
  id: string;
  alert?: string;
  created_at?: string;
}

export const BudgetsRepo = {
  getAll(): BudgetRecord[] {
    const db = getDb();
    const rows = db.prepare("SELECT * FROM budgets ORDER BY budget DESC").all() as any[];
    return rows.map((r) => ({
      id: r.id,
      k: r.k,
      oct: Number(r.oct),
      sep: Number(r.sep),
      budget: Number(r.budget),
      owner: r.owner,
      alert: r.alert,
      created_at: r.created_at,
    }));
  },

  create(data: { k: string; budget: number; owner: string; alert?: string }): BudgetRecord {
    const db = getDb();
    const id = `b-${Date.now().toString(36)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO budgets (id, k, oct, sep, budget, owner, alert, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.k, 0, 0, data.budget, data.owner, data.alert || "90% of budget", now);

    const r = db.prepare("SELECT * FROM budgets WHERE id = ?").get(id) as any;
    return {
      id: r.id,
      k: r.k,
      oct: Number(r.oct),
      sep: Number(r.sep),
      budget: Number(r.budget),
      owner: r.owner,
      alert: r.alert,
      created_at: r.created_at,
    };
  },

  update(id: string, patch: Partial<BudgetRecord>): BudgetRecord | null {
    const db = getDb();
    const current = db.prepare("SELECT * FROM budgets WHERE id = ?").get(id) as any;
    if (!current) return null;

    const updated = { ...current, ...patch };
    db.prepare(`
      UPDATE budgets
      SET k = ?, oct = ?, sep = ?, budget = ?, owner = ?, alert = ?
      WHERE id = ?
    `).run(updated.k, updated.oct, updated.sep, updated.budget, updated.owner, updated.alert, id);

    const r = db.prepare("SELECT * FROM budgets WHERE id = ?").get(id) as any;
    return {
      id: r.id,
      k: r.k,
      oct: Number(r.oct),
      sep: Number(r.sep),
      budget: Number(r.budget),
      owner: r.owner,
      alert: r.alert,
      created_at: r.created_at,
    };
  },

  delete(id: string): boolean {
    const db = getDb();
    const res = db.prepare("DELETE FROM budgets WHERE id = ?").run(id);
    return res.changes > 0;
  },
};
