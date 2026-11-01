"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Bell, Database, Lightbulb, Search, TrendingUp, Activity } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Chart, Legend, Sparkline } from "@/components/charts";
import { useChat } from "@/components/chat-store";
import { Change, Empty, Mark, PageHeader, Seg, Status } from "@/components/ui";
import { INSIGHTS, NOTIFICATIONS, STATUS_TONE } from "@/lib/data";
import { fmtDate, kfmt, money, pct, signedMoney } from "@/lib/format";
import { useData } from "@/lib/client/store";

const INSIGHT_ICON = { err: AlertTriangle, ok: TrendingUp, warn: Activity, info: Lightbulb };

function Notifications() {
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button className="icon-btn" aria-label={read ? "Notifications" : `Notifications, ${NOTIFICATIONS.length} unread`} aria-expanded={open} onClick={() => setOpen(!open)}>
        <Bell size={18} />
        {!read && <span style={{ position: "absolute", top: 7, right: 8, width: 8, height: 8, borderRadius: "50%", background: "var(--err-dot)", border: "2px solid var(--paper)" }} />}
      </button>
      {open && (
        <div className="menu" style={{ right: 0, top: "calc(100% + 8px)", width: 340, maxWidth: "calc(100vw - 32px)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px" }}>
            <span className="overline">Notifications</span>
            <button className="link-btn" onClick={() => setRead(true)}>Mark all as read</button>
          </div>
          {NOTIFICATIONS.map((n) => (
            <Link key={n.title} href={n.href} className="menu-item" style={{ alignItems: "flex-start", textDecoration: "none" }} onClick={() => setOpen(false)}>
              <span aria-hidden style={{ width: 8, height: 8, borderRadius: "50%", marginTop: 7, flex: "none", background: n.tone === "err" ? "var(--err-dot)" : n.tone === "warn" ? "var(--warn-dot)" : "var(--blue)" }} />
              <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: "block", fontWeight: read ? 400 : 500 }}>{n.title}</span><span className="muted" style={{ fontSize: 12 }}>{n.meta}</span></span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Overview() {
  const [range, setRange] = useState(12);
  const [noData, setNoData] = useState(false);
  const { send } = useChat();
  const { transactions, metrics } = useData();
  const router = useRouter();
  const ask = (q: string) => router.push(`/chat/${send(null, q, [])}`);

  const REV = metrics?.rev || [182400, 176900, 191300, 198700, 205200, 212800, 208100, 221500, 229900, 224300, 238600, 246800];
  const EXP = metrics?.exp || [141200, 139800, 146500, 151900, 149300, 158700, 162400, 160100, 166800, 171200, 169400, 178300];
  const OCF = metrics?.ocf || [38900, 33600, 41200, 44100, 52300, 49800, 43200, 58600, 60100, 49700, 61800, 54200];
  const NET = metrics?.net || REV.map((r, idx) => r - EXP[idx]);
  const MONTHS = metrics?.months || ["Nov 25", "Dec 25", "Jan 26", "Feb 26", "Mar 26", "Apr 26", "May 26", "Jun 26", "Jul 26", "Aug 26", "Sep 26", "Oct 26"];
  const CASH = metrics?.cash || 412600;

  const i = REV.length - 1;
  const lab = MONTHS.slice(-range), rv = REV.slice(-range), ex = EXP.slice(-range);
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
  const kpis = [
    { l: "Total revenue", v: REV, c: "#0A0A0A" },
    { l: "Total expenses", v: EXP, c: "#3D5AFE", inv: true },
    { l: "Net profit", v: NET, c: "#0A0A0A" },
    { l: "Operating cash flow", v: OCF, c: "#0A0A0A" },
  ];
  const hr = new Date().getHours();
  const greet = hr < 5 ? "Working late" : hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="page">
      <PageHeader
        eyebrow={new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        title={`${greet}, Selam`}
        actions={
          <>
            <Link href="/search" className="btn" style={{ color: "var(--muted)", fontWeight: 400 }}><Search size={16} />Search</Link>
            <Notifications />
            <Link href="/settings" className="avatar" aria-label="Profile">S</Link>
          </>
        }
      />
      <label className="muted" style={{ fontSize: 12.5, display: "flex", gap: 8, alignItems: "center", alignSelf: "flex-start" }}>
        <input type="checkbox" checked={noData} onChange={(e) => setNoData(e.target.checked)} /> Preview: no data connected yet
      </label>

      {noData ? (
        <div className="card">
          <Empty icon={<Database size={18} />} title="Connect your data to see your overview." action={<div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}><Link href="/data-sources" className="btn primary">Connect a data source</Link><Link href="/chat" className="btn">Upload a statement in chat</Link></div>}>
            Fremwork builds this page from your accounting software, bank feed or uploaded statements. It takes about two minutes after you connect.
          </Empty>
        </div>
      ) : (
        <>
          <div className="grid cols-4">
            {kpis.map((k) => {
              const c = pct(k.v[i], k.v[i - 1]);
              return (
                <section key={k.l} className="card" style={{ padding: "18px 18px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}><span className="muted" style={{ fontSize: 13, fontWeight: 500 }}>{k.l}</span><Change value={c} invert={k.inv} /></div>
                  <div className="num" style={{ fontSize: 26, letterSpacing: "-0.02em", fontWeight: 600, lineHeight: 1.1 }}>{money(k.v[i])}</div>
                  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8 }}>
                    <small className="muted" style={{ fontSize: 12, lineHeight: 1.35 }}>October 2026<br />vs {money(k.v[i - 1])} in Sep</small>
                    <Sparkline values={k.v.slice(-8)} color={k.c} />
                  </div>
                </section>
              );
            })}
          </div>

          <div className="grid cols-main">
            <div className="grid" style={{ alignContent: "start" }}>
              <section className="card">
                <div className="card-head" style={{ paddingBottom: 0 }}>
                  <div><h2>Financial performance</h2><p>Revenue vs expenses by month</p></div>
                  <Seg label="Date range" value={range} onChange={setRange} options={[{ v: 3, l: "3M" }, { v: 6, l: "6M" }, { v: 12, l: "12M" }]} />
                </div>
                <div style={{ padding: "14px 20px 4px" }}>
                  <Legend items={[{ name: `Revenue ${kfmt(sum(rv))}`, color: "#0A0A0A" }, { name: `Expenses ${kfmt(sum(ex))}`, color: "#3D5AFE" }, { name: `Net profit ${kfmt(sum(rv) - sum(ex))}`, color: "#9E9E9A", line: true }]} />
                </div>
                <div style={{ padding: "6px 16px 14px 8px" }}>
                  <Chart height={260} label="Monthly revenue versus expenses" labels={lab} series={[{ name: "Revenue", values: rv, color: "#0A0A0A" }, { name: "Expenses", values: ex, color: "#3D5AFE" }, { name: "Net profit", values: rv.map((r, j) => r - ex[j]), color: "#9E9E9A", kind: "line" }]} />
                </div>
              </section>
              <section className="card">
                <div className="card-head">
                  <div><h2>Recent transactions</h2><p>Latest activity across all accounts</p></div>
                  <Link href="/transactions" className="btn sm">View all →</Link>
                </div>
                <div className="table-wrap">
                  <table className="t" style={{ minWidth: 560 }}>
                    <thead><tr><th>Transaction</th><th>Category</th><th>Date</th><th className="r">Amount</th><th>Status</th></tr></thead>
                    <tbody>
                      {transactions.slice(0, 6).map((t) => (
                        <tr key={t.id} className="click" onClick={() => router.push(`/transactions?tx=${t.id}`)}>
                          <td><Link href={`/transactions?tx=${t.id}`} style={{ color: "inherit", textDecoration: "none", fontWeight: 500 }}>{t.name}</Link><div className="sub">{t.memo}</div></td>
                          <td>{t.cat}</td>
                          <td className="num">{fmtDate(t.date)}</td>
                          <td className={t.amt > 0 ? "r num amt-in" : "r num"}>{signedMoney(t.amt)}</td>
                          <td><Status tone={STATUS_TONE[t.status]}>{t.status}</Status></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
            <section className="card">
              <div className="card-head" style={{ paddingBottom: 10 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}><Mark /><div><h2>AI financial insights</h2><p>From your October ledger</p></div></div>
              </div>
              {INSIGHTS.map((n) => {
                const I = INSIGHT_ICON[n.tone];
                return (
                  <div key={n.title} style={{ display: "flex", gap: 12, padding: "14px 20px", borderTop: "1px solid var(--mist)" }}>
                    <span className={`ic-box ${n.tone}`}><I size={18} /></span>
                    <div>
                      <span className="overline">{n.tag}</span>
                      <h3 style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 500 }}>{n.title}</h3>
                      <p className="muted" style={{ margin: 0, fontSize: 13 }}>{n.text}</p>
                      <button className="link-btn" style={{ marginTop: 6 }} onClick={() => ask(n.q)}>Ask Fremwork →</button>
                    </div>
                  </div>
                );
              })}
              <div className="muted" style={{ padding: "14px 20px", borderTop: "1px solid var(--line)", fontSize: 12.5 }}>Cash on hand <b className="num" style={{ color: "var(--ink)" }}>{money(CASH)}</b> · {metrics?.octoberSummary?.runwayMonths || 2.3} months of expenses</div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
