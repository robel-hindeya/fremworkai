"use client";

import { AlertTriangle, Building2, CheckCircle2, CreditCard, Landmark, RefreshCw, Upload, Users } from "lucide-react";
import { useRef, useState } from "react";
import { ConfirmDialog } from "@/components/forms";
import { useToast } from "@/components/toast";
import { Banner, PageHeader, Progress, Status } from "@/components/ui";
import { UPLOADS, type Source } from "@/lib/data";
import { checkFiles } from "@/lib/format";
import { useData } from "@/lib/client/store";

const ICONS: Record<string, typeof Building2> = { qb: Building2, bank: Landmark, stripe: CreditCard, xero: Building2, gusto: Users };

export default function DataSources() {
  const toast = useToast();
  const { dataSources: sources, syncDataSource } = useData();
  const [uploads, setUploads] = useState(UPLOADS);
  const [errors, setErrors] = useState<string[]>([]);
  const [disconnect, setDisconnect] = useState<Source | null>(null);
  const [attempts, setAttempts] = useState<Record<string, number>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const connect = async (s: Source) => {
    const n = (attempts[s.id] ?? 0) + 1;
    setAttempts((a) => ({ ...a, [s.id]: n }));

    // Xero's first attempt fails to show connection error
    if (s.id === "xero" && n === 1) {
      toast("Couldn’t connect to Xero. Try again.", "err");
      return;
    }

    try {
      await syncDataSource(s.id);
      toast(`${s.name} connected and synced`);
    } catch (e: any) {
      toast(e.message || `Couldn't connect to ${s.name}`, "err");
    }
  };

  const healthy = sources.filter((s) => s.status === "connected").length;
  const broken = sources.filter((s) => s.status === "error");

  return (
    <div className="page">
      <PageHeader eyebrow="Financial tools" title="Data sources" sub="Where Fremwork reads your numbers from. Access is read-only; Fremwork never moves money."
        actions={<button className="btn primary" onClick={() => fileRef.current?.click()}><Upload size={16} />Upload files</button>} />
      <input ref={fileRef} type="file" multiple hidden onChange={(e) => {
        const r = checkFiles(Array.from(e.target.files ?? []), 0);
        setUploads((u) => [...r.ok.map((f) => ({ name: f.name, note: `Reading · ${f.size}`, ok: true })), ...u]);
        setErrors(r.errors);
        if (r.ok.length) toast(`${r.ok.length} file${r.ok.length > 1 ? "s" : ""} uploaded. Fremwork is reading them now.`);
        e.target.value = "";
      }} />
      {broken.length > 0 && <Banner tone="err" title={`${broken.length} source${broken.length > 1 ? "s need" : " needs"} attention.`}>Figures from {broken.map((b) => b.name).join(" and ")} may be out of date until you reconnect.</Banner>}
      {errors.length > 0 && <Banner tone="err" title="Some files weren’t uploaded.">{errors.join(" ")}</Banner>}

      <section className="card">
        <div className="card-head"><div><h2>Connections</h2><p>{healthy} connected · {sources.length - healthy} not connected or need attention</p></div></div>
        {sources.map((s) => {
          const I = ICONS[s.id] ?? Building2;
          return (
            <div key={s.id} style={{ display: "grid", gridTemplateColumns: "minmax(200px,1.5fr) minmax(180px,2fr) auto", gap: 16, alignItems: "center", padding: "16px 20px", borderTop: "1px solid var(--line)" }} className="source-row">
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--rail)", display: "grid", placeItems: "center" }}><I size={20} /></div>
                <div><b style={{ fontWeight: 500 }}>{s.name}</b><small className="muted" style={{ display: "block", fontSize: 12 }}>{s.kind}</small></div>
              </div>
              <div>
                <div style={{ fontSize: 13, color: "var(--ink2)" }}>{s.detail}</div>
                {s.status === "syncing" && typeof s.progress === "number" && <div style={{ marginTop: 6 }}><Progress value={s.progress} tone="blue" /></div>}
                {s.message && <div style={{ fontSize: 12.5, color: "var(--neg)", marginTop: 4 }}>{s.message}</div>}
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "flex-end", flexWrap: "wrap" }}>
                {s.status === "connected" ? (
                  <>
                    <Status tone="ok"><CheckCircle2 size={12} /> Connected</Status>
                    <button className="btn sm" onClick={() => syncDataSource(s.id)}><RefreshCw size={13} />Sync</button>
                    <button className="btn sm text-danger" onClick={() => setDisconnect(s)}>Disconnect</button>
                  </>
                ) : s.status === "syncing" ? (
                  <Status tone="info">Syncing…</Status>
                ) : s.status === "error" ? (
                  <>
                    <Status tone="err"><AlertTriangle size={12} /> Needs attention</Status>
                    <button className="btn primary sm" onClick={() => connect(s)}>Reconnect</button>
                  </>
                ) : (
                  <button className="btn sm" onClick={() => connect(s)}>Connect</button>
                )}
              </div>
            </div>
          );
        })}
      </section>
      <style>{`@media (max-width: 760px) { .source-row { grid-template-columns: 1fr !important; } .source-row > :last-child { justify-content: flex-start !important; } }`}</style>

      <section className="card">
        <div className="card-head"><div><h2>Uploaded files</h2><p>{uploads.length} documents</p></div><button className="btn sm" onClick={() => fileRef.current?.click()}><Upload size={14} />Upload another</button></div>
        {uploads.map((u) => (
          <div key={u.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: "1px solid var(--line)", fontSize: 13.5 }}>
            <div><b style={{ fontWeight: 500 }}>{u.name}</b><div className="sub">{u.note}</div></div>
            <Status tone={u.ok ? "ok" : "err"}>{u.ok ? "Ready" : "Couldn’t read"}</Status>
          </div>
        ))}
      </section>

      {disconnect && (
        <ConfirmDialog
          title={`Disconnect ${disconnect.name}?`}
          body={`Fremwork will stop syncing with ${disconnect.name}. Historical transactions already imported won’t be deleted.`}
          confirmLabel={`Disconnect ${disconnect.name}`}
          danger
          onClose={() => setDisconnect(null)}
          onConfirm={() => {
            toast(`${disconnect.name} disconnected`);
            setDisconnect(null);
          }}
        />
      )}
    </div>
  );
}
