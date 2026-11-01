"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { Chart, DONUT_COLORS, Donut, Legend } from "@/components/charts";
import { ExportDialog } from "@/components/forms";
import { Change, FieldError, PageHeader, Seg, Status } from "@/components/ui";
import { kfmt, money, pct } from "@/lib/format";
import { useData } from "@/lib/client/store";

const MONTH_START = new Date(2025, 10, 1); // Nov 2025 = index 0

function monthIndex(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return (d.getFullYear() - MONTH_START.getFullYear()) * 12 + d.getMonth() - MONTH_START.getMonth();
}

export default function Analytics() {
  const { metrics, budgets } = useData();
  const [range, setRange] = useState<"3" | "6" | "12" | "ytd" | "custom">("12");
  const [from, setFrom] = useState("2025-11-01");
  const [to, setTo] = useState("2026-10-31");
  const [exporting, setExporting] = useState(false);

  const MONTHS = metrics?.months || ["Nov 25", "Dec 25", "Jan 26", "Feb 26", "Mar 26", "Apr 26", "May 26", "Jun 26", "Jul 26", "Aug 26", "Sep 26", "Oct 26"];
  const REV = metrics?.rev || [182400, 176900, 191300, 198700, 205200, 212800, 208100, 221500, 229900, 224300, 238600, 246800];
  const EXP = metrics?.exp || [141200, 139800, 146500, 151900, 149300, 158700, 162400, 160100, 166800, 171200, 169400, 178300];
  const OCF = metrics?.ocf || [38900, 33600, 41200, 44100, 52300, 49800, 43200, 58600, 60100, 49700, 61800, 54200];

  let rangeErr = "";
  let idx: number[];
  if (range === "custom") {
    const a = monthIndex(from), b = monthIndex(to);
    if (!from || !to) rangeErr = "Pick both a start and an end date.";
    else if (a > b) rangeErr = "The start date must be before the end date.";
    else if (b < 0 || a > 11) rangeErr = "Your data covers Nov 2025 to Oct 2026. Pick dates in that range.";
    idx = rangeErr ? MONTHS.map((_, i) => i) : MONTHS.map((_, i) => i).filter((i) => i >= Math.max(0, a) && i <= Math.min(11, b));
  } else {
    const n = range === "ytd" ? 10 : +range;
    idx = MONTHS.map((_, i) => i).slice(-n);
  }

  const lab = idx.map((i) => MONTHS[i]);
  const R = idx.map((i) => REV[i]), E = idx.map((i) => EXP[i]), C = idx.map((i) => OCF[i]);
  const N = R.map((r, j) => r - E[j]);
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
  const avg = sum(R) / (R.length || 1);
  const margins = R.map((r, j) => (N[j] / (r || 1)) * 100);

  const CATS = budgets;
  const tot = CATS.reduce((a, c) => a + c.oct, 0) || 1;
  const g = (k: string) => CATS.find((c) => c.k === k)?.oct || 0;
  const groups = [
    { k: "Payroll", v: g("Payroll") }, { k: "Cost of services", v: g("Cost of services") }, { k: "Contractors", v: g("Contractors") },
    { k: "Rent & Utilities", v: g("Rent & Utilities") }, { k: "Marketing", v: g("Marketing") }, { k: "Software", v: g("Software") },
    { k: "Other", v: g("Insurance & fees") + g("Travel") + g("Office") },
  ];

  return (
    <div className="page">
      <PageHeader eyebrow="Financial tools" title="Analytics" sub="Revenue, spending, profitability and cash flow over any period."
        actions={<>
          <Seg label="Date range" value={range} onChange={setRange} options={[{ v: "3", l: "3M" }, { v: "6", l: "6M" }, { v: "12", l: "12M" }, { v: "ytd", l: "YTD" }, { v: "custom", l: "Custom" }]} />
          <button className="btn" onClick={() => setExporting(true)}><Download size={16} />Export</button>
        </>} />

      {range === "custom" && (
        <div className="card card-pad" style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div className="field"><label htmlFor="an-from">From</label><input id="an-from" type="date" className="input" value={from} aria-invalid={!!rangeErr} onChange={(e) => setFrom(e.target.value)} /></div>
          <div className="field"><label htmlFor="an-to">To</label><input id="an-to" type="date" className="input" value={to} aria-invalid={!!rangeErr} onChange={(e) => setTo(e.target.value)} /></div>
          {rangeErr ? <FieldError>{rangeErr} Showing all 12 months for now.</FieldError> : <span className="muted" style={{ fontSize: 13 }}>{lab.length} month{lab.length > 1 ? "s" : ""} selected</span>}
        </div>
      )}

      <section className="card">
        <div className="grid cols-4" style={{ gap: 0, borderBottom: "1px solid var(--line)" }}>
          {[["Revenue", money(sum(R)), `${lab[0]} – ${lab.at(-1)}`], ["Expenses", money(sum(E)), `${((sum(E) / (sum(R) || 1)) * 100).toFixed(1)}% of revenue`], ["Net profit", money(sum(N)), `${((sum(N) / (sum(R) || 1)) * 100).toFixed(1)}% net margin`], ["Operating cash flow", money(sum(C)), `${((sum(C) / (sum(N) || 1)) * 100).toFixed(0)}% of profit converted`]].map(([l, v, n]) => (
            <div key={l} style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 4, borderRight: "1px solid var(--mist)" }}>
              <small className="muted" style={{ fontSize: 12 }}>{l}</small><b className="num" style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em" }}>{v}</b><small className="muted" style={{ fontSize: 12 }}>{n}</small>
            </div>
          ))}
        </div>
        <div className="card-head" style={{ paddingBottom: 0 }}><div><h2>Revenue analysis</h2><p>Monthly revenue, average {money(Math.round(avg))} a month</p></div><Legend items={[{ name: "Revenue", color: "#0A0A0A" }, { name: "Average", color: "#9E9E9A", line: true }]} /></div>
        <div style={{ padding: "10px 16px 16px 6px" }}>
          <Chart height={250} base="auto" label="Revenue trend" labels={lab} series={[{ name: "Revenue", values: R, color: "#0A0A0A", kind: "line", area: true }, { name: "Average", values: R.map(() => Math.round(avg)), color: "#9E9E9A", kind: "line", dashed: true }]} />
        </div>
      </section>

      <div className="grid cols-2">
        <section className="card">
          <div className="card-head" style={{ paddingBottom: 0 }}><div><h2>Expense breakdown</h2><p>October 2026 by category</p></div></div>
          <div style={{ display: "flex", gap: 24, alignItems: "center", padding: "16px 20px 20px", flexWrap: "wrap" }}>
            <Donut segments={groups} center={kfmt(tot)} caption="total spend" />
            <div style={{ flex: 1, minWidth: 220, display: "flex", flexDirection: "column", gap: 8 }}>
              {groups.map((s, i) => (
                <div key={s.k} style={{ display: "grid", gridTemplateColumns: "12px minmax(0,1fr) auto 52px", gap: 10, alignItems: "center", fontSize: 13.5 }}>
                  <i style={{ width: 10, height: 10, borderRadius: 3, background: DONUT_COLORS[i] }} /><span>{s.k}</span><span className="num">{money(s.v)}</span><span className="num muted" style={{ textAlign: "right" }}>{((s.v / tot) * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="card">
          <div className="card-head" style={{ paddingBottom: 0 }}><div><h2>Profitability</h2><p>Net margin by month</p></div><Status tone="ok">{(margins.at(-1) || 0).toFixed(1)}% latest</Status></div>
          <div style={{ padding: "14px 16px 16px 6px" }}>
            <Chart height={220} base="auto" label="Net margin trend" labels={lab} fmt={(n) => n.toFixed(1) + "%"} yfmt={(n) => Math.round(n) + "%"} series={[{ name: "Net margin", values: margins, color: "#3D5AFE", kind: "line", area: true }]} />
          </div>
        </section>
      </div>

      <section className="card">
        <div className="card-head" style={{ paddingBottom: 0 }}><div><h2>Cash flow trends</h2><p>Cash in, cash out and net operating cash flow</p></div><Legend items={[{ name: "Cash in", color: "#0A0A0A" }, { name: "Cash out", color: "#8FA2FF" }, { name: "Net", color: "#3D5AFE", line: true }]} /></div>
        <div style={{ padding: "14px 16px 16px 6px" }}>
          <Chart height={250} label="Cash flow trend" labels={lab} series={[{ name: "Cash in", values: idx.map((i) => EXP[i] + OCF[i]), color: "#0A0A0A" }, { name: "Cash out", values: E, color: "#8FA2FF" }, { name: "Net cash flow", values: C, color: "#3D5AFE", kind: "line" }]} />
        </div>
      </section>

      <section className="card" style={{ overflow: "hidden" }}>
        <div className="card-head"><div><h2>Monthly comparison</h2><p>Month-over-month change for each line</p></div></div>
        <div className="table-wrap">
          <table className="t num" style={{ minWidth: 760 }}>
            <thead><tr><th>Month</th><th className="r">Revenue</th><th className="r">MoM</th><th className="r">Expenses</th><th className="r">MoM</th><th className="r">Net profit</th><th className="r">Margin</th><th className="r">Cash flow</th></tr></thead>
            <tbody>
              {idx.slice().reverse().map((i) => (
                <tr key={i}>
                  <td>{MONTHS[i]}</td><td className="r">{money(REV[i])}</td><td className="r">{i ? <Change value={pct(REV[i], REV[i - 1])} /> : "—"}</td>
                  <td className="r">{money(EXP[i])}</td><td className="r">{i ? <Change value={pct(EXP[i], EXP[i - 1])} invert /> : "—"}</td>
                  <td className="r">{money(REV[i] - EXP[i])}</td><td className="r">{(((REV[i] - EXP[i]) / (REV[i] || 1)) * 100).toFixed(1)}%</td><td className="r">{money(OCF[i])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {exporting && <ExportDialog report="Analytics" initialFormat="XLSX" onClose={() => setExporting(false)} />}
    </div>
  );
}
