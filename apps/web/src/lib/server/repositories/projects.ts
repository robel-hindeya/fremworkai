import { getDb } from "../db";
import type { Project } from "@/lib/data";

export interface ProjectRecord extends Project {
  created_at?: string;
}

export const ProjectsRepo = {
  getAll(): ProjectRecord[] {
    const db = getDb();
    const rows = db.prepare("SELECT * FROM projects ORDER BY created_at ASC").all() as any[];
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      desc: r.desc,
      chats: JSON.parse(r.chats_json || "[]"),
      docs: JSON.parse(r.docs_json || "[]"),
      reports: JSON.parse(r.reports_json || "[]"),
      updated: r.updated,
      created_at: r.created_at,
    }));
  },

  getById(id: string): ProjectRecord | null {
    const db = getDb();
    const r = db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as any;
    if (!r) return null;
    return {
      id: r.id,
      name: r.name,
      desc: r.desc,
      chats: JSON.parse(r.chats_json || "[]"),
      docs: JSON.parse(r.docs_json || "[]"),
      reports: JSON.parse(r.reports_json || "[]"),
      updated: r.updated,
      created_at: r.created_at,
    };
  },

  create(data: { name: string; desc: string }): ProjectRecord {
    const db = getDb();
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `proj-${Date.now()}`;
    const id = `${slug}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO projects (id, name, desc, chats_json, docs_json, reports_json, updated, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.name, data.desc, "[]", "[]", "[]", "Just now", now);

    return this.getById(id)!;
  },

  update(id: string, patch: Partial<{ name: string; desc: string; chats: string[]; docs: string[]; reports: string[]; updated: string }>): ProjectRecord | null {
    const db = getDb();
    const current = this.getById(id);
    if (!current) return null;

    const name = patch.name ?? current.name;
    const desc = patch.desc ?? current.desc;
    const chats = JSON.stringify(patch.chats ?? current.chats);
    const docs = JSON.stringify(patch.docs ?? current.docs);
    const reports = JSON.stringify(patch.reports ?? current.reports);
    const updated = patch.updated ?? "Just now";

    db.prepare(`
      UPDATE projects
      SET name = ?, desc = ?, chats_json = ?, docs_json = ?, reports_json = ?, updated = ?
      WHERE id = ?
    `).run(name, desc, chats, docs, reports, updated, id);

    return this.getById(id);
  },

  delete(id: string): boolean {
    const db = getDb();
    const res = db.prepare("DELETE FROM projects WHERE id = ?").run(id);
    return res.changes > 0;
  },
};
