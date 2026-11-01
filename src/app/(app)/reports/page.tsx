"use client";

import Link from "next/link";
import { Activity, BarChart3, Building2, Download, Plus, Scale, TrendingUp, Wallet } from "lucide-react";
import { useState } from "react";
import { ExportDialog } from "@/components/forms";
import { PageHeader } from "@/components/ui";
import { CATS, STREAMS } from "@/lib/data";
import { money, pct } from "@/lib/format";

type Line = ["sec" | "ind" | "tot" | "grand", string, string?];
const TYPES = [
  { k: "pl", t: "Profit & Loss", d: "Revenue, costs and net profit for the period", g: "Generated today", icon: Scale },
  { k: "bs", t: "Balance Sheet", d: "Assets, liabilities and equity at period end", g: "Generated Oct 30", icon: Building2 },
  { k: "cf", t: "Cash Flow Statement", d: "Operating, investing and financing cash flows", g: "Generated Oct 30", icon: Activity },
  { k: "rev", t: "Revenue Report", d: "Revenue by stream and top customers", g: "Generated Oct 30", icon: TrendingUp },
  { k: "exp", t: "Expense Report", d: "Spending by category against budget", g: "Generated Oct 28", icon: Wallet },
  { k: "perf", t: "Financial Performance", d: "Key ratios and KPIs in one page", g: "Generated Oct 27", icon: BarChart3 },
] as const;

function statement(k: string): Line[] {
  const o = STREAMS.Oct;
  switch (k) {
    case "bs": return [["sec", "Assets"], ["ind", "Cash", "412,600"], ["ind", "Accounts receivable", "168,900"], ["ind", "Prepaid expenses", "21,400"], ["ind", "Equipment, net", "64,300"], ["tot", "Total assets", "$667,200"], ["sec", "Liabilities"], ["ind", "Accounts payable", "48,700"], ["ind", "Accrued payroll", "31,200"], ["ind", "Deferred revenue", "142,500"], ["ind", "Term loan", "80,000"], ["tot", "Total liabilities", "$302,400"], ["sec", "Equity"], ["ind", "Share capital", "150,000"], ["ind", "Retained earnings", "214,800"], ["tot", "Total equity", "$364,800"], ["grand", "Liabilities + equity", "$667,200"]];
    case "cf": return [["sec", "Operating activities"], ["ind", "Net profit", "68,500"], ["ind", "Increase in receivables", "(21,600)"], ["ind", "Increase in deferred revenue", "9,400"], ["ind", "Decrease in payables", "(2,100)"], ["tot", "Net cash from operations", "54,200"], ["sec", "Investing activities"], ["ind", "Equipment purchases", "(6,800)"], ["tot", "Net cash from investing", "(6,800)"], ["sec", "Financing activities"], ["ind", "Loan repayment", "(5,000)"], ["tot", "Net cash from financing", "(5,000)"], ["tot", "Net change in cash", "42,400"], ["ind", "Opening cash", "370,200"], ["grand", "Closing cash", "$412,600"]];
    case "rev": return [["sec", "By stream"], ...(Object.keys(o) as (keyof typeof o)[]).map((s): Line => ["ind", `${s} · ▲ ${pct(o[s], STREAMS.Sep[s]).toFixed(1)}%`, money(o[s])]), ["tot", "Total revenue", "$246,800"], ["sec", "Top customers"], ["ind", "Lumen Health", "42,000"], ["ind", "Brightline Retail", "18,500"], ["ind", "Sable Finance", "14,200"], ["ind", "Northwind Labs", "12,400"], ["ind", "Kestrel Logistics", "9,800"], ["grand", "Top five share of revenue", "39.7%"]];
    case "exp": return [["sec", "Category · actual / budget"], ...CATS.map((c): Line => ["ind", c.oct > c.budget ? `${c.k} · over` : c.k, `${money(c.oct)} / ${money(c.budget)}`]), ["grand", "Total", "$178,300 / $186,500"]];
    case "perf": return [["sec", "Growth"], ["ind", "Revenue growth, month over month", "3.4%"], ["ind", "Revenue growth, 12 months", "35.3%"], ["sec", "Profitability"], ["ind", "Gross margin", "85.7%"], ["ind", "Net margin", "27.8%"], ["ind", "Operating expense ratio", "58.0%"], ["sec", "Liquidity"], ["ind", "Cash runway", "2.3 months"], ["ind", "Days sales outstanding", "41 days"], ["ind", "Current ratio", "2.6×"], ["grand", "Cash conversion (cash flow ÷ profit)", "79%"]];
    default: return [["sec", "Revenue"], ["ind", "Subscriptions", money(o.Subscriptions)], ["ind", "Services", money(o.Services)], ["ind", "Licensing", money(o.Licensing)], ["tot", "Total revenue", "$246,800"], ["sec", "Cost of revenue"], ["ind", "Hosting & delivery", "(21,860)"], ["ind", "Contractors", "(13,400)"], ["tot", "Gross profit · 85.7%", "$211,540"], ["sec", "Operating expenses"], ["ind", "Payroll", "(94,200)"], ["ind", "Rent & utilities", "(12,500)"], ["ind", "Marketing", "(11,850)"], ["ind", "Software", "(9,640)"], ["ind", "Insurance & fees", "(7,750)"], ["ind", "Travel", "(5,120)"], ["ind", "Office", "(1,980)"], ["tot", "Total operating expenses", "(143,040)"], ["grand", "Net profit before tax", "$68,500"]];
  }
}

const RECENT = [["Profit & Loss", "October 2026", "Today, 12:40 AM", "PDF"], ["Cash Flow Statement", "October 2026", "Oct 30, 6:05 PM", "XLSX"], ["Revenue Report", "Week of Oct 26", "Oct 30, 5:00 PM", "PDF"], ["Balance Sheet", "Sep 30, 2026", "Oct 3, 9:12 AM", "PDF"], ["Expense Report", "September 2026", "Oct 1, 9:00 AM", "XLSX"]];

export default function Reports() {
  const [sel, setSel] = useState<string>("pl");
  const [period, setPeriod] = useState("October 2026");
  const [exp, setExp] = useState<{ report: string; format: string } | null>(null);
  const cur = TYPES.find((t) => t.k === sel)!;
  const noData = period === "Q1 2025";
  return (
    <div className="page">
      <PageHeader eyebrow="Workspace" title="Financial reports" sub="Generate, preview and export your statements."
        actions={<Link className="btn primary" href="/chat"><Plus size={16} />Generate with AI</Link>} />
      <div className="grid" style={{ gridTemplateColumns: "minmax(0,340px) minmax(0,1fr)", alignItems: "start" }} id="reports-grid">
        <div role="group" aria-label="Report types" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {TYPES.map((t) => (
            <button key={t.k} type="button" aria-pressed={sel === t.k} onClick={() => setSel(t.k)} className="card" style={{ display: "flex", gap: 12, padding: 14, textAlign: "left", alignItems: "flex-start", borderRadius: 12, borderColor: sel === t.k ? "var(--ink)" : undefined, boxShadow: sel === t.k ? "0 0 0 1px var(--ink)" : undefined }}>
              <span className="ic-box"><t.icon size={18} /></span>
              <span><b style={{ display: "block", fontWeight: 500 }}>{t.t}</b><small className="muted" style={{ fontSize: 12.5 }}>{t.d}</small><small className="mono muted" style={{ display: "block", fontSize: 11, marginTop: 4 }}>{t.g.toUpperCase()}</small></span>
            </button>
          ))}
        </div>
        <section className="card" style={{ overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "12px 16px", borderBottom: "1px solid var(--line)" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <label htmlFor="r-period" className="overline">Period</label>
              <select id="r-period" className="select pill-input" style={{ width: "auto", height: 34 }} value={period} onChange={(e) => setPeriod(e.target.value)}>
                <option>October 2026</option><option>September 2026</option><option>Q3 2026</option><option>Year to date 2026</option><option>Q1 2025</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {["PDF", "XLSX", "CSV"].map((f) => <button key={f} className="btn sm" disabled={noData} onClick={() => setExp({ report: cur.t, format: f })}><Download size={14} />{f}</button>)}
            </div>
          </div>
          {noData ? (
            <div className="empty"><h3>No data for Q1 2025.</h3><p>Your connected data starts in November 2025. Upload a trial balance for Q1 2025 to build this report.</p><Link href="/data-sources" className="btn">Go to Data sources</Link></div>
          ) : (
            <div className="doc">
              <div className="doc-head">
                <div><span className="overline">Harbor &amp; Pine Co. · Demo</span><h2>{cur.t}</h2><p className="muted" style={{ margin: "2px 0 0", fontSize: 13 }}>{sel === "bs" ? "As at October 31, 2026" : period} · USD</p></div>
                <span className="demo-pill" style={{ alignSelf: "flex-start" }}>Preview</span>
              </div>
              <table className="st"><tbody>{statement(sel).map(([c, a, b], i) => <tr key={i} className={c}><td>{a}</td><td className="r">{b ?? ""}</td></tr>)}</tbody></table>
              <p className="muted" style={{ fontSize: 12, margin: "16px 0 0" }}>Prepared by Fremwork from demo ledger data. Unaudited.</p>
            </div>
          )}
        </section>
      </div>
      <section className="card" style={{ overflow: "hidden" }}>
        <div className="card-head"><div><h2>Recent reports</h2><p>Generated reports you can download again</p></div></div>
        <div className="table-wrap">
          <table className="t" style={{ minWidth: 620 }}>
            <thead><tr><th>Report</th><th>Period</th><th>Generated</th><th>Format</th><th className="r">Download</th></tr></thead>
            <tbody>{RECENT.map(([n, p, g, f]) => (
              <tr key={n + p}><td style={{ fontWeight: 500 }}>{n}</td><td>{p}</td><td className="num muted">{g}</td><td><span className="tag">{f}</span></td>
                <td className="r"><button className="icon-btn" aria-label={`Download ${n}`} onClick={() => setExp({ report: n, format: f })}><Download size={18} /></button></td></tr>
            ))}</tbody>
          </table>
        </div>
      </section>
      <style>{`@media (max-width: 980px) { #reports-grid { grid-template-columns: minmax(0,1fr) !important; } }`}</style>
      {exp && <ExportDialog report={exp.report} initialFormat={exp.format} onClose={() => setExp(null)} />}
    </div>
  );
}
