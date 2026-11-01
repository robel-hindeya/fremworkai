"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Chart, Legend } from "@/components/charts";
import type { AnswerKind } from "@/components/chat-store";
import { Change } from "@/components/ui";
import { CATS, EXP, MONTHS, NET, OCF, REV, STREAMS } from "@/lib/data";
import { money, pct } from "@/lib/format";

export function Table({ head, rows, foot }: { head: string[]; rows: ReactNode[][]; foot?: ReactNode[] }) {
  return (
    <div className="card table-wrap" style={{ borderRadius: 12 }}>
      <table className="t num" style={{ minWidth: 460 }}>
        <thead><tr>{head.map((h, i) => <th key={h} className={i ? "r" : undefined}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className={j ? "r" : undefined}>{c}</td>)}</tr>)}
          {foot && <tr>{foot.map((c, j) => <td key={j} className={j ? "r" : undefined} style={{ fontWeight: 600, borderTop: "1px solid var(--ink)" }}>{c}</td>)}</tr>}
        </tbody>
      </table>
    </div>
  );
}

export function Recos({ items }: { items: ReactNode[] }) {
  return (
    <>
      <h2>Recommendations</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((t, i) => <div key={i} className="reco"><span className="n">{i + 1}</span><div>{t}</div></div>)}
      </div>
    </>
  );
}

function ChartCard({ title, legend, children }: { title: string; legend?: ReactNode; children: ReactNode }) {
  return (
    <div className="card" style={{ borderRadius: 12, overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", padding: "10px 14px", borderBottom: "1px solid var(--line)" }}>
        <b style={{ fontWeight: 500, fontSize: 13.5 }}>{title}</b>{legend}
      </div>
      <div style={{ padding: "10px 10px 6px 0" }}>{children}</div>
    </div>
  );
}

export function Answer({ kind, fileName }: { kind: AnswerKind; fileName?: string }) {
  const i = 11;
  switch (kind) {
    case "nodata":
      return (
        <>
          <p>I can’t see any transactions for that period. Your connected data starts in <b>November 2025</b>, so I can’t compare it without guessing.</p>
          <p>To answer this, connect the account that holds that history, or upload a statement or trial balance for the period.</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link className="btn sm primary" href="/data-sources">Connect data</Link>
            <span className="btn sm" style={{ pointerEvents: "none" }}>Or attach a file below</span>
          </div>
        </>
      );
    case "expenses": {
      const tot = CATS.reduce((a, c) => a + c.oct, 0), ptot = CATS.reduce((a, c) => a + c.sep, 0);
      return (
        <>
          <p>You spent <b>{money(tot)}</b> in October, up {pct(tot, ptot).toFixed(1)}% on September. Payroll is 53% of the total and steady. Most of the increase came from the Q4 insurance premium, contractors and travel. Software ran 20.5% over budget.</p>
          <Table head={["Category", "October", "Share", "vs Sep"]} rows={CATS.map((c) => [c.k, money(c.oct), ((c.oct / tot) * 100).toFixed(1) + "%", <Change key={c.k} value={pct(c.oct, c.sep)} invert />])} foot={["Total", money(tot), "100%", <Change key="t" value={pct(tot, ptot)} invert />]} />
          <h2>Software in detail</h2>
          <pre className="calc">{`Budget            8,000\nActual            9,640\nOver budget       1,640  (20.5%)\nUnused seats      14 seats ≈ 1,180 / month`}</pre>
          <Recos items={["Remove the 14 inactive seats in Slack (6), HubSpot (3) and Figma (5).", "Move Notion and Figma to annual billing; most vendors discount 15–20% for it.", "Treat the Q4 insurance premium as a one-off when comparing months. Without it, spending rose 3.2%."]} />
        </>
      );
    }
    case "forecast":
      return (
        <>
          <p>Base case: cash rises from <b>$412,600</b> today to about <b>$625,900</b> by the end of January. December has the largest outflows because of year-end bonuses, but every month stays cash-positive.</p>
          <Table head={["", "Nov 2026", "Dec 2026", "Jan 2027"]} rows={[["Opening cash", "412,600", "485,300", "554,700"], ["Cash in", "254,200", "261,800", "248,100"], ["Cash out", "(181,500)", "(192,400)", "(176,900)"], ["Net cash flow", "+72,700", "+69,400", "+71,200"]]} foot={["Closing cash", "$485,300", "$554,700", "$625,900"]} />
          <ChartCard title="Cash in vs cash out" legend={<Legend items={[{ name: "In", color: "#0A0A0A" }, { name: "Out", color: "#3D5AFE" }]} />}>
            <Chart height={190} label="Forecast inflows and outflows" labels={["Nov", "Dec", "Jan"]} series={[{ name: "Cash in", values: [254200, 261800, 248100], color: "#0A0A0A" }, { name: "Cash out", values: [181500, 192400, 176900], color: "#3D5AFE" }]} />
          </ChartCard>
          <h2>Assumptions</h2>
          <ul><li>Collections grow 3% a month, with a January dip as annual renewals fall in Q4.</li><li>The $86,400 in overdue receivables is collected evenly over November and December.</li><li>Year-end bonuses of $14,800 are paid in December.</li></ul>
          <pre className="calc">{`Downside (overdue invoices not collected):\nJan closing cash = 625,900 − 86,400 = 539,500\nRunway at Oct spend = 539,500 ÷ 178,300 = 3.0 months`}</pre>
        </>
      );
    case "risks":
      return (
        <>
          <p>I found four risks worth acting on. The first two compound: slow collections from a concentrated customer base.</p>
          <div className="card" style={{ borderRadius: 12 }}>
            {[["err", "High", "Receivables ageing", "$86,400 is more than 45 days overdue across Brightline Retail, Orbit Media and Vela Hotels. Orbit’s last card payment failed on Oct 17."], ["warn", "Medium", "Customer concentration", "Lumen Health is 31% of trailing-quarter revenue. Losing them would cut monthly profit by about $25k."], ["warn", "Medium", "Thin cash reserve", "Cash covers 2.3 months of expenses against your 3-month policy."], ["info", "Low", "Budget drift", "Software and travel are over budget for the second month running."]].map(([t, l, h, d]) => (
              <div key={h} className="list-row" style={{ alignItems: "flex-start" }}><span className={`status ${t}`} style={{ marginTop: 2 }}>{l}</span><div className="main"><b style={{ whiteSpace: "normal" }}>{h}</b><small style={{ fontSize: 13, lineHeight: 1.5, display: "block" }}>{d}</small></div></div>
            ))}
          </div>
          <pre className="calc">{`Policy reserve = 3 × 178,300 = 534,900\nCash on hand   = 412,600\nGap            = 122,300`}</pre>
          <Recos items={["Send reminders on all three overdue invoices this week, and ask Orbit Media to update their card.", "Offer a 2% discount for annual prepayment to two mid-size clients.", "Keep the daily cash alert at 2 months of runway (already scheduled)."]} />
        </>
      );
    case "compare": {
      const o = STREAMS.Oct, s = STREAMS.Sep;
      return (
        <>
          <p>October revenue was <b>{money(REV[i])}</b>, up <b>$8,200 (3.4%)</b> on September. All three revenue streams grew; licensing grew fastest.</p>
          <Table head={["Stream", "October", "September", "Change"]} rows={(Object.keys(o) as (keyof typeof o)[]).map((k) => [k, money(o[k]), money(s[k]), <Change key={k} value={pct(o[k], s[k])} />])} foot={["Total", money(REV[i]), money(REV[i - 1]), <Change key="t" value={pct(REV[i], REV[i - 1])} />]} />
          <pre className="calc">{`Growth = (246,800 − 238,600) ÷ 238,600\n       = 8,200 ÷ 238,600\n       = 3.4%\nSubscriptions contributed 4,400 of the 8,200 (54%).`}</pre>
          <ChartCard title="Monthly revenue · 12 months"><Chart height={180} base="auto" label="Revenue trend" labels={MONTHS} series={[{ name: "Revenue", values: REV, color: "#0A0A0A", kind: "line", area: true }]} /></ChartCard>
          <Recos items={["Lumen Health’s $42,000 annual plan landed Oct 30. Ask about multi-year terms before renewal.", "Northwind Labs renewed two weeks early ($12,400, still pending). Confirm the invoice is paid.", "Retry Orbit Media’s failed $6,250 payment."]} />
        </>
      );
    }
    case "report":
      return (
        <>
          <p>Here’s a draft Profit &amp; Loss for October 2026. I saved it to Financial Reports so you can export it or add the balance sheet and cash flow statement.</p>
          <Table head={["Line", "October 2026"]} rows={[["Total revenue", money(246800)], ["Cost of revenue", "(35,260)"], ["Gross profit · 85.7%", money(211540)], ["Operating expenses", "(143,040)"]]} foot={["Net profit before tax", money(68500)]} />
          <ul><li>Revenue grew 3.4% to $246.8k, the best month of the year.</li><li>Net margin fell 1.2 points to 27.8%, driven by the Q4 insurance premium and travel.</li><li>Cash rose to $412.6k; collections are the main lever next quarter.</li></ul>
          <div><Link className="btn sm" href="/reports">Open in Financial Reports</Link></div>
        </>
      );
    case "files":
      return (
        <>
          <p>I read <b>{fileName}</b>. In this preview I can’t parse the contents, so here’s how the analysis looks using your demo ledger.</p>
          <Answer kind="performance" />
        </>
      );
    default:
      return (
        <>
          <p>October was your strongest revenue month of the year at <b>{money(REV[i])}</b>, up 3.4% on September. Expenses grew faster, at 5.3%, so net profit slipped 1.0% to <b>{money(NET[i])}</b>. The business is profitable and growing; the thing to watch is cash conversion, which weakened this month.</p>
          <Table head={["Metric", "Oct 2026", "Sep 2026", "Change"]} rows={[["Revenue", money(REV[i]), money(REV[i - 1]), <Change key="a" value={pct(REV[i], REV[i - 1])} />], ["Expenses", money(EXP[i]), money(EXP[i - 1]), <Change key="b" value={pct(EXP[i], EXP[i - 1])} invert />], ["Net profit", money(NET[i]), money(NET[i - 1]), <Change key="c" value={pct(NET[i], NET[i - 1])} />], ["Net margin", "27.8%", "29.0%", <Change key="d" value={-1.2} suffix=" pts" />], ["Operating cash flow", money(OCF[i]), money(OCF[i - 1]), <Change key="e" value={pct(OCF[i], OCF[i - 1])} />]]} />
          <ChartCard title="Revenue, expenses and profit · May–Oct 2026" legend={<Legend items={[{ name: "Revenue", color: "#0A0A0A" }, { name: "Expenses", color: "#3D5AFE" }, { name: "Net", color: "#9E9E9A", line: true }]} />}>
            <Chart height={200} label="Six-month trend" labels={MONTHS.slice(-6)} series={[{ name: "Revenue", values: REV.slice(-6), color: "#0A0A0A", kind: "line", area: true }, { name: "Expenses", values: EXP.slice(-6), color: "#3D5AFE", kind: "line" }, { name: "Net profit", values: NET.slice(-6), color: "#9E9E9A", kind: "line", dashed: true }]} />
          </ChartCard>
          <h2>How the margin moved</h2>
          <pre className="calc">{`Net margin  = Net profit ÷ Revenue\nOct         = 68,500 ÷ 246,800 = 27.8%\nSep         = 69,200 ÷ 238,600 = 29.0%\nChange      = −1.2 percentage points`}</pre>
          <Recos items={[<><b>Chase the three overdue invoices.</b> $86,400 is past 45 days; collecting half lifts cash flow back above September’s level.</>, <><b>Trim software to budget.</b> Removing 14 unused seats saves about $1,180 a month.</>, <><b>Set a 14-day booking rule for travel.</b> October’s late bookings added roughly $900.</>]} />
        </>
      );
  }
}
