"use client";

import { AlertTriangle, Building2, CheckCircle2, CreditCard, Landmark, RefreshCw, Upload, Users } from "lucide-react";
import { useRef, useState } from "react";
import { ConfirmDialog } from "@/components/forms";
import { useToast } from "@/components/toast";
import { Banner, PageHeader, Progress, Status } from "@/components/ui";
import { SOURCES, UPLOADS, type Source } from "@/lib/data";
import { checkFiles } from "@/lib/format";

const ICONS: Record<string, typeof Building2> = { qb: Building2, bank: Landmark, stripe: CreditCard, xero: Building2, gusto: Users };

export default function DataSources() {
  const toast = useToast();
  const [sources, setSources] = useState<Source[]>(SOURCES);
  const [uploads, setUploads] = useState(UPLOADS);
  const [errors, setErrors] = useState<string[]>([]);
  const [disconnect, setDisconnect] = useState<Source | null>(null);
  const [attempts, setAttempts] = useState<Record<string, number>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (id: string, patch: Partial<Source>) => setSources((s) => s.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const connect = (s: Source) => {
    set(s.id, { status: "syncing", progress: 5, message: undefined });
    const n = (attempts[s.id] ?? 0) + 1;
    setAttempts((a) => ({ ...a, [s.id]: n }));
    setTimeout(() => {
      // Xero's first attempt fails, to show the connection error.
      if (s.id === "xero" && n === 1) {
        set(s.id, { status: "error", message: "Xero didn’t give Fremwork access. You may have closed the Xero window, or your Xero role can’t share data. Try again, or ask your Xero admin." });
        toast("Couldn’t connect to Xero", "err");
      } else {
        set(s.id, { status: "connected", detail: "Connected just now · first sync running", message: undefined });
        toast(`${s.name} connected`);
      }
    }, 1500);
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
            <div key={s.id} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "16px 20px", borderTop: "1px solid var(--mist)", flexWrap: "wrap" }}>
              <span className="ic-box"><I size={18} /></span>
              <div style={{ flex: 1, minWidth: 220, display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <b style={{ fontWeight: 500 }}>{s.name}</b><span className="tag">{s.kind}</span>
                  {s.status === "connected" && <Status tone="ok">Up to date</Status>}
                  {s.status === "syncing" && <Status tone="info">Syncing</Status>}
                  {s.status === "error" && <Status tone="err">Needs attention</Status>}
                </div>
                <span className="muted" style={{ fontSize: 13 }}>{s.detail}</span>
                {s.status === "syncing" && <div style={{ maxWidth: 360 }}><Progress value={s.progress ?? 30} tone="blue" /></div>}
                {s.message && <span style={{ color: "var(--neg)", fontSize: 13, display: "flex", gap: 6 }}><AlertTriangle size={14} style={{ flex: "none", marginTop: 3 }} />{s.message}</span>}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {s.status === "connected" && <><button className="btn sm" onClick={() => { toast(`Syncing ${s.name}…`); }}><RefreshCw size={14} />Sync now</button><button className="btn sm ghost" onClick={() => setDisconnect(s)}>Disconnect</button></>}
                {s.status === "error" && <button className="btn sm primary" onClick={() => connect(s)}>{s.id === "bank" ? "Reconnect" : "Try again"}</button>}
                {s.status === "disconnected" && <button className="btn sm primary" onClick={() => connect(s)}>Connect</button>}
                {s.status === "syncing" && <span className="muted" style={{ fontSize: 13 }}>{s.progress && s.progress > 10 ? `${s.progress}%` : "Connecting…"}</span>}
              </div>
            </div>
          );
        })}
      </section>

      <section className="card">
        <div className="card-head"><div><h2>Uploaded files</h2><p>PDF, XLSX or CSV · up to 25 MB each</p></div></div>
        {uploads.map((u) => (
          <div key={u.name} className="list-row">
            {u.ok ? <CheckCircle2 size={18} color="var(--pos)" /> : <AlertTriangle size={18} color="var(--neg)" />}
            <span className="main"><b>{u.name}</b><small style={{ color: u.ok ? undefined : "var(--neg)" }}>{u.note}</small></span>
            {!u.ok && <button className="btn sm" onClick={() => fileRef.current?.click()}>Upload again</button>}
          </div>
        ))}
      </section>

      {disconnect && (
        <ConfirmDialog danger title={`Disconnect ${disconnect.name}?`} confirmLabel="Disconnect" onClose={() => setDisconnect(null)}
          body="Fremwork stops reading new data from it. Figures already imported stay, but reports and scheduled tasks that rely on it will be out of date."
          onConfirm={() => { set(disconnect.id, { status: "disconnected", detail: "Disconnected just now" }); toast(`${disconnect.name} disconnected`); setDisconnect(null); }} />
      )}
    </div>
  );
}
