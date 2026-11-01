import { getDb } from "../db";
import type { Source, SourceStatus } from "@/lib/data";

export interface DataSourceRecord extends Source {
  updated_at?: string;
}

export const DataSourcesRepo = {
  getAll(): DataSourceRecord[] {
    const db = getDb();
    const rows = db.prepare("SELECT * FROM data_sources ORDER BY rowid ASC").all() as any[];
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      kind: r.kind,
      detail: r.detail,
      status: r.status as SourceStatus,
      message: r.message || undefined,
      progress: r.progress !== null ? Number(r.progress) : undefined,
      updated_at: r.updated_at,
    }));
  },

  update(id: string, patch: Partial<{ status: SourceStatus; message: string; progress: number; detail: string }>): DataSourceRecord | null {
    const db = getDb();
    const current = db.prepare("SELECT * FROM data_sources WHERE id = ?").get(id) as any;
    if (!current) return null;

    const status = patch.status ?? current.status;
    const message = patch.message !== undefined ? patch.message : current.message;
    const progress = patch.progress !== undefined ? patch.progress : current.progress;
    const detail = patch.detail ?? current.detail;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE data_sources
      SET status = ?, message = ?, progress = ?, detail = ?, updated_at = ?
      WHERE id = ?
    `).run(status, message, progress, detail, now, id);

    const r = db.prepare("SELECT * FROM data_sources WHERE id = ?").get(id) as any;
    return {
      id: r.id,
      name: r.name,
      kind: r.kind,
      detail: r.detail,
      status: r.status,
      message: r.message || undefined,
      progress: r.progress !== null ? Number(r.progress) : undefined,
      updated_at: r.updated_at,
    };
  },

  sync(id: string): { success: boolean; message: string; record: DataSourceRecord } {
    const db = getDb();
    const r = db.prepare("SELECT * FROM data_sources WHERE id = ?").get(id) as any;
    if (!r) throw new Error("Data source not found");

    if (id === "xero") {
      // Simulate OAuth connection failure once or success
      this.update(id, {
        status: "connected",
        message: undefined,
        detail: "Connected · Synced just now",
      });
    } else if (id === "bank") {
      this.update(id, {
        status: "connected",
        message: undefined,
        detail: "Operating account ··2210 · Synced just now",
      });
    } else {
      this.update(id, {
        status: "connected",
        progress: 100,
        detail: "Synced just now",
      });
    }

    const updated = this.getAll().find((x) => x.id === id)!;
    return { success: true, message: `${r.name} synced successfully.`, record: updated };
  },
};
