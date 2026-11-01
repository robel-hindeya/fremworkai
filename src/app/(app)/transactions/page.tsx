"use client";

import { useSearchParams } from "next/navigation";
import { Download, Plus, Search, X } from "lucide-react";
import { Suspense, useMemo, useState } from "react";
import { ConfirmDialog, ExportDialog, TransactionDialog } from "@/components/forms";
import { useToast } from "@/components/toast";
import { Banner, Empty, Field, PageHeader, Status } from "@/components/ui";
import { STATUS_TONE, TRANSACTIONS, TX_CATEGORIES, type Tx } from "@/lib/data";
import { TODAY, fmtDate, money, signedMoney } from "@/lib/format";

const RANGES = [{ v: "7", l: "Last 7 days" }, { v: "30", l: "Last 30 days" }, { v: "90", l: "Last 90 days" }, { v: "all", l: "All time" }];

function Details({ tx, onChange, onDelete, onClose }: { tx: Tx; onChange: (t: Tx) => void; onDelete: () => void; onClose: () => void }) {
  const [note, setNote] = useState("");
  const toast = useToast();
  const notes: Partial<Record<Tx["status"], [string, string]>> = {
    Flagged: ["Needs attention", "Booked less than 7 days before travel, outside your travel policy. Add a note for your accountant."],
    Failed: ["Payment failed", "The customer’s card was declined on Oct 17. Fremwork can draft a payment reminder."],
    Pending: ["Waiting for payment", "The invoice is sent. Fremwork will mark it cleared when the money lands."],
  };
  const n = notes[tx.status];
  return (
    <aside className="card" aria-label="Transaction details" style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
        <div><span className="overline">{tx.id}</span><div style={{ fontWeight: 600, fontSize: 16 }}>Transaction details</div></div>
        <button className="icon-btn" aria-label="Close details" onClick={onClose}><X size={18} /></button>
      </div>
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <div className={tx.amt > 0 ? "num amt-in" : "num"} style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.1 }}>{signedMoney(tx.amt)}</div>
          <div style={{ marginTop: 6, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}><b style={{ fontWeight: 500 }}>{tx.name}</b><Status tone={STATUS_TONE[tx.status]}>{tx.status}</Status></div>
        </div>
        <dl style={{ display: "grid", gridTemplateColumns: "120px minmax(0,1fr)", gap: "10px 12px", margin: 0, fontSize: 13.5 }}>
          <dt className="muted">Description</dt><dd style={{ margin: 0 }}>{tx.memo}</dd>
          <dt className="muted">Date</dt><dd style={{ margin: 0 }}>{fmtDate(tx.date)}</dd>
          <dt className="muted">Payment method</dt><dd style={{ margin: 0 }}>{tx.method}</dd>
          <dt className="muted">Account</dt><dd style={{ margin: 0 }}>Operating account ··2210</dd>
          <dt className="muted">Receipt</dt><dd style={{ margin: 0, color: tx.amt < 0 && tx.status === "Flagged" ? "var(--neg)" : undefined }}>{tx.amt > 0 ? "Not required" : tx.status === "Flagged" ? "Missing" : "Attached"}</dd>
        </dl>
        <Field id="tx-cat" label="Category">{(a) => <select {...a} className="select" value={tx.cat} onChange={(e) => { onChange({ ...tx, cat: e.target.value }); toast(`Category changed to ${e.target.value}`); }}>{TX_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>}</Field>
        {n && <Banner tone={tx.status === "Failed" ? "err" : tx.status === "Pending" ? "info" : "warn"} title={n[0] + "."}>{n[1]}</Banner>}
        <Field id="tx-note" label="Note for your accountant" error={note.length > 500 ? `Keep notes under 500 characters (${note.length} now).` : undefined}>
          {(a) => <textarea {...a} className="textarea" rows={3} placeholder="Add context" value={note} onChange={(e) => setNote(e.target.value)} />}
        </Field>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "14px 20px", borderTop: "1px solid var(--line)", marginTop: "auto" }}>
        <button className="btn primary" disabled={tx.status === "Reviewed" || note.length > 500} onClick={() => { onChange({ ...tx, status: "Reviewed" }); toast(`${tx.id} marked as reviewed`); }}>
          {tx.status === "Reviewed" ? "Reviewed" : "Mark as reviewed"}
        </button>
        <button className="btn text-danger" style={{ marginLeft: "auto" }} onClick={onDelete}>Delete</button>
      </div>
    </aside>
  );
}

function TransactionsInner() {
  const params = useSearchParams();
  const toast = useToast();
  const [list, setList] = useState<Tx[]>(TRANSACTIONS);
  const [tab, setTab] = useState<"all" | "income" | "expense">("all");
  const [q, setQ] = useState("");
  const [range, setRange] = useState("90");
  const [cat, setCat] = useState("all");
  const [sel, setSel] = useState<string | null>(params.get("tx"));
  const [dialog, setDialog] = useState<"add" | "export" | "delete" | null>(null);

  const rows = useMemo(() => {
    const days = range === "all" ? Infinity : +range;
    const t0 = new Date(TODAY + "T12:00:00").getTime();
    const s = q.trim().toLowerCase();
    return list.filter((t) =>
      (tab === "all" || (tab === "income" ? t.amt > 0 : t.amt < 0)) &&
      (cat === "all" || t.cat === cat) &&
      (t0 - new Date(t.date + "T12:00:00").getTime()) / 864e5 <= days &&
      (!s || `${t.name} ${t.memo} ${t.id} ${t.cat} ${t.method}`.toLowerCase().includes(s))
    );
  }, [list, tab, q, range, cat]);

  const selected = list.find((t) => t.id === sel) ?? null;
  const moneyIn = rows.filter((t) => t.amt > 0).reduce((a, t) => a + t.amt, 0);
  const moneyOut = rows.filter((t) => t.amt < 0).reduce((a, t) => a + t.amt, 0);
  const count = (k: typeof tab) => list.filter((t) => k === "all" || (k === "income" ? t.amt > 0 : t.amt < 0)).length;
  const filtered = q || cat !== "all" || range !== "90" || tab !== "all";
  const clear = () => { setQ(""); setCat("all"); setRange("90"); setTab("all"); };
  const update = (t: Tx) => setList((l) => l.map((x) => (x.id === t.id ? t : x)));

  return (
    <div className="page">
      <PageHeader eyebrow="Financial tools" title="Transactions" sub="Every payment in and out, with status and payment method."
        actions={<><button className="btn" onClick={() => setDialog("export")}><Download size={16} />Export CSV</button><button className="btn primary" onClick={() => setDialog("add")}><Plus size={16} />Add transaction</button></>} />

      <div className="grid" style={{ gridTemplateColumns: selected ? "minmax(0,1fr) minmax(0,360px)" : "minmax(0,1fr)", alignItems: "start" }}>
        <section className="card" style={{ overflow: "hidden" }}>
          <div className="tabs" role="tablist" aria-label="Transaction type">
            {([["all", "All"], ["income", "Income"], ["expense", "Expenses"]] as const).map(([k, l]) => (
              <button key={k} role="tab" aria-selected={tab === k} className="tab-btn" onClick={() => setTab(k)}>{l} <span className="mono" style={{ fontSize: 11, color: "var(--faint)" }}>{count(k)}</span></button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", padding: "14px 16px", borderBottom: "1px solid var(--line)" }}>
            <div className="search" style={{ flex: 1, minWidth: 200 }}><Search size={16} /><label htmlFor="tx-q" className="sr-only">Search transactions</label><input id="tx-q" type="search" className="input pill-input" placeholder="Search by name, ID or memo" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <label htmlFor="tx-range" className="sr-only">Date range</label>
            <select id="tx-range" className="select pill-input" style={{ width: "auto" }} value={range} onChange={(e) => setRange(e.target.value)}>{RANGES.map((r) => <option key={r.v} value={r.v}>{r.l}</option>)}</select>
            <label htmlFor="tx-cat-filter" className="sr-only">Category</label>
            <select id="tx-cat-filter" className="select pill-input" style={{ width: "auto" }} value={cat} onChange={(e) => setCat(e.target.value)}><option value="all">All categories</option>{TX_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
          </div>
          {rows.length === 0 ? (
            <Empty icon={<Search size={18} />} title="No transactions match these filters." action={filtered ? <button className="btn" onClick={clear}>Clear filters</button> : undefined}>
              {q ? `Nothing matches “${q}”. Check the spelling, or try a wider date range.` : "Try a wider date range or another category."}
            </Empty>
          ) : (
            <div className="table-wrap">
              <table className="t" style={{ minWidth: 680 }}>
                <thead><tr><th>Transaction</th><th>Category</th><th>Date</th><th>Payment method</th><th className="r">Amount</th><th>Status</th></tr></thead>
                <tbody>
                  {rows.map((t) => (
                    <tr key={t.id} className={t.id === sel ? "click sel" : "click"} onClick={() => setSel(t.id)}>
                      <td><button className="link-btn" style={{ color: "var(--ink)", fontSize: 13.5 }} onClick={(e) => { e.stopPropagation(); setSel(t.id); }}>{t.name}</button><div className="sub">{t.id} · {t.memo}</div></td>
                      <td>{t.cat}</td>
                      <td className="num">{fmtDate(t.date)}</td>
                      <td style={{ color: "var(--ink2)" }}>{t.method}</td>
                      <td className={t.amt > 0 ? "r num amt-in" : "r num"}>{signedMoney(t.amt)}</td>
                      <td><Status tone={STATUS_TONE[t.status]}>{t.status}</Status></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="num muted" style={{ display: "flex", gap: 24, flexWrap: "wrap", padding: "12px 16px", borderTop: "1px solid var(--line)", fontSize: 13 }}>
            <span><b style={{ color: "var(--ink)", fontWeight: 500 }}>{rows.length}</b> transactions</span>
            <span>Money in <b style={{ color: "var(--ink)", fontWeight: 500 }}>{money(moneyIn, 2)}</b></span>
            <span>Money out <b style={{ color: "var(--ink)", fontWeight: 500 }}>{money(moneyOut, 2)}</b></span>
          </div>
        </section>
        {selected && <Details key={selected.id} tx={selected} onChange={update} onDelete={() => setDialog("delete")} onClose={() => setSel(null)} />}
      </div>

      {dialog === "add" && <TransactionDialog onClose={() => setDialog(null)} onAdd={(t) => {
        const id = "TX-" + (Math.max(...list.map((x) => +x.id.slice(3))) + 1);
        setList((l) => [{ id, name: t.name, memo: t.memo, cat: t.cat, date: t.date, amt: t.amt, status: "Cleared", method: t.method }, ...l]);
        setRange("all");
      }} />}
      {dialog === "export" && <ExportDialog report="Transactions" initialFormat="CSV" onClose={() => setDialog(null)} />}
      {dialog === "delete" && selected && (
        <ConfirmDialog danger title="Delete transaction?" sub={`${selected.id} · ${selected.name} · ${signedMoney(selected.amt)}`} confirmLabel="Delete"
          body="This removes it from Transactions, reports and this month’s budget. You can’t undo this." onClose={() => setDialog(null)}
          onConfirm={() => { setList((l) => l.filter((t) => t.id !== selected.id)); setSel(null); setDialog(null); toast(`${selected.id} deleted`); }} />
      )}
      {selected && <MobileDetailsHint />}
    </div>
  );
}

/** On phones the details panel stacks below the table; this nudges the reader to it. */
function MobileDetailsHint() {
  return <style>{`@media (max-width: 960px) { .page > .grid { grid-template-columns: minmax(0,1fr) !important; } }`}</style>;
}

export default function TransactionsPage() {
  return <Suspense><TransactionsInner /></Suspense>;
}
