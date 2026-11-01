// Demo data for Harbor & Pine Co. Everything here is sample data, clearly labelled in the UI.

export const MONTHS = ["Nov 25", "Dec 25", "Jan 26", "Feb 26", "Mar 26", "Apr 26", "May 26", "Jun 26", "Jul 26", "Aug 26", "Sep 26", "Oct 26"];
export const REV = [182400, 176900, 191300, 198700, 205200, 212800, 208100, 221500, 229900, 224300, 238600, 246800];
export const EXP = [141200, 139800, 146500, 151900, 149300, 158700, 162400, 160100, 166800, 171200, 169400, 178300];
export const OCF = [38900, 33600, 41200, 44100, 52300, 49800, 43200, 58600, 60100, 49700, 61800, 54200];
export const NET = REV.map((r, i) => r - EXP[i]);
export const CASH = 412600;

export const STREAMS = {
  Oct: { Subscriptions: 148300, Services: 72400, Licensing: 26100 },
  Sep: { Subscriptions: 143900, Services: 70100, Licensing: 24600 },
};

export type BudgetCat = { k: string; oct: number; sep: number; budget: number; owner: string };
export const CATS: BudgetCat[] = [
  { k: "Payroll", oct: 94200, sep: 93800, budget: 95000, owner: "People" },
  { k: "Cost of services", oct: 21860, sep: 20950, budget: 24000, owner: "Hosting & delivery" },
  { k: "Contractors", oct: 13400, sep: 11200, budget: 18000, owner: "Delivery" },
  { k: "Rent & Utilities", oct: 12500, sep: 12500, budget: 12500, owner: "Facilities" },
  { k: "Marketing", oct: 11850, sep: 12900, budget: 14000, owner: "Growth" },
  { k: "Software", oct: 9640, sep: 8050, budget: 8000, owner: "Operations" },
  { k: "Insurance & fees", oct: 7750, sep: 4450, budget: 8000, owner: "Finance" },
  { k: "Travel", oct: 5120, sep: 3240, budget: 4000, owner: "Sales" },
  { k: "Office", oct: 1980, sep: 2310, budget: 3000, owner: "Facilities" },
];

export type TxStatus = "Cleared" | "Pending" | "Flagged" | "Failed" | "Reviewed";
export type Tx = { id: string; name: string; memo: string; cat: string; date: string; amt: number; status: TxStatus; method: string };
export const TRANSACTIONS: Tx[] = [
  ["TX-10482", "Lumen Health", "Annual subscription", "Subscriptions", "2026-10-30", 42000, "Cleared", "Bank transfer"],
  ["TX-10481", "Amazon Web Services", "Hosting · October", "Cost of services", "2026-10-29", -6284.17, "Cleared", "Corporate card ··4417"],
  ["TX-10480", "Gusto", "Payroll · Oct 16–31", "Payroll", "2026-10-28", -47100, "Cleared", "ACH"],
  ["TX-10479", "Brightline Retail", "Implementation, phase 2", "Services", "2026-10-27", 18500, "Pending", "Invoice INV-2291"],
  ["TX-10478", "Ethiopian Airlines", "ADD → NBO, 2 tickets", "Travel", "2026-10-26", -2860, "Flagged", "Corporate card ··4417"],
  ["TX-10477", "Figma", "Organization plan", "Software", "2026-10-25", -1440, "Cleared", "Corporate card ··4417"],
  ["TX-10476", "Kestrel Logistics", "Monthly plan", "Subscriptions", "2026-10-24", 9800, "Cleared", "Card via Stripe"],
  ["TX-10475", "Meta Ads", "Q4 awareness campaign", "Marketing", "2026-10-23", -3750, "Cleared", "Corporate card ··4417"],
  ["TX-10474", "Northwind Labs", "License renewal", "Licensing", "2026-10-22", 12400, "Pending", "Invoice INV-2288"],
  ["TX-10473", "Bole Office Park", "Rent · November", "Rent & Utilities", "2026-10-21", -11200, "Cleared", "Bank transfer"],
  ["TX-10472", "Slack", "Business+ · 23 seats", "Software", "2026-10-20", -1035, "Cleared", "Corporate card ··4417"],
  ["TX-10471", "Addis Freelance Collective", "Design sprint", "Contractors", "2026-10-18", -6700, "Cleared", "Bank transfer"],
  ["TX-10470", "Orbit Media", "Monthly plan", "Subscriptions", "2026-10-17", 6250, "Failed", "Card via Stripe"],
  ["TX-10469", "HubSpot", "Sales Hub · Pro", "Software", "2026-10-16", -2180, "Cleared", "Corporate card ··4417"],
  ["TX-10468", "Gusto", "Payroll · Oct 1–15", "Payroll", "2026-10-14", -47100, "Cleared", "ACH"],
  ["TX-10467", "Hilton Nairobi", "3 nights", "Travel", "2026-10-12", -1480, "Flagged", "Corporate card ··4417"],
  ["TX-10466", "Sable Finance", "Advisory retainer", "Services", "2026-10-10", 14200, "Cleared", "Bank transfer"],
  ["TX-10465", "Staples", "Office supplies", "Office", "2026-10-08", -412.6, "Cleared", "Corporate card ··4417"],
  ["TX-10464", "Chubb", "Liability premium · Q4", "Insurance & fees", "2026-10-06", -3900, "Cleared", "ACH"],
  ["TX-10463", "Google Ads", "Search campaign", "Marketing", "2026-10-04", -2600, "Cleared", "Corporate card ··4417"],
  ["TX-10462", "Pioneer Foods", "Annual subscription", "Subscriptions", "2026-09-29", 24000, "Cleared", "Bank transfer"],
  ["TX-10460", "Gusto", "Payroll · Sep 16–30", "Payroll", "2026-09-28", -46900, "Cleared", "ACH"],
  ["TX-10459", "Vela Hotels", "Implementation, phase 1", "Services", "2026-08-30", 21800, "Cleared", "Bank transfer"],
].map(([id, name, memo, cat, date, amt, status, method]) => ({ id, name, memo, cat, date, amt, status, method }) as Tx);

export const STATUS_TONE: Record<TxStatus, string> = { Cleared: "ok", Pending: "info", Flagged: "warn", Failed: "err", Reviewed: "ok" };
export const TX_CATEGORIES = ["Subscriptions", "Services", "Licensing", ...CATS.map((c) => c.k)];
export const PAY_METHODS = ["Corporate card ··4417", "Bank transfer", "ACH", "Cash", "Card via Stripe"];

export type Goal = { id: string; type: string; name: string; cur: number; target: number; start: number; date: string; down?: boolean; status: "On track" | "Behind pace" | "Not started"; ai: string };
export const GOALS: Goal[] = [
  { id: "g1", type: "Savings target", name: "Six-month cash reserve", cur: 412600, target: 1069800, start: 250000, date: "2027-06-30", status: "Behind pace", ai: "At the current $54k average monthly operating cash flow you reach the target around October 2027, four months late. Collecting the $86.4k in receivables older than 45 days closes about two of those months." },
  { id: "g2", type: "Revenue target", name: "Q4 revenue of $760k", cur: 246800, target: 760000, start: 0, date: "2026-12-31", status: "On track", ai: "October is at 32% of target with a third of the quarter gone. November and December need $256.6k each, about 4% monthly growth, in line with the last six months." },
  { id: "g3", type: "Expense reduction", name: "Cut software spend 20%", cur: 9640, target: 7700, start: 9640, date: "2027-01-31", down: true, status: "Not started", ai: "14 unused seats across Slack, HubSpot and Figma cost about $1,180 a month. Removing them gets you 61% of the way. Annual billing for Notion and Figma covers most of the rest." },
  { id: "g4", type: "Expense reduction", name: "Hold travel under $4k a month", cur: 5120, target: 4000, start: 5120, date: "2026-12-31", down: true, status: "Not started", ai: "Two flights in October were booked less than 7 days out, adding roughly $900. A 14-day advance booking rule would have kept October within budget." },
];

export type Project = { id: string; name: string; desc: string; chats: string[]; docs: string[]; reports: string[]; updated: string };
export const PROJECTS: Project[] = [
  { id: "q4-board-pack", name: "Q4 Board Pack", desc: "Statements, commentary and KPI pack for the December board meeting.", chats: ["board-pack", "q3-summary"], docs: ["Board_deck_Q3.pdf", "KPI_definitions.xlsx", "Q3_trial_balance.csv"], reports: ["Profit & Loss · Q3 2026", "Balance Sheet · Sep 30, 2026"], updated: "Today" },
  { id: "cost-reduction", name: "Cost reduction 2026", desc: "Finding savings across software, travel and contractors without slowing delivery.", chats: ["software-audit"], docs: ["Software_seats_export.csv", "Travel_policy_v2.pdf"], reports: ["Expense Report · October 2026"], updated: "Yesterday" },
  { id: "seed-extension", name: "Seed extension", desc: "Runway modelling and investor data room prep for the 2027 raise.", chats: ["cash-runway", "receivables-risk"], docs: ["Cap_table.xlsx", "Forecast_FY27.xlsx"], reports: ["Cash Flow Statement · October 2026"], updated: "Oct 27" },
  { id: "fy27-budget", name: "FY2027 annual budget", desc: "Department budgets, hiring plan and revenue targets for next year.", chats: ["revenue-compare"], docs: ["Hiring_plan_FY27.xlsx"], reports: [], updated: "Oct 21" },
];

export type Task = { id: string; name: string; prompt: string; freq: string; next: string; last: string; lastFailed?: boolean; on: boolean };
export const TASKS: Task[] = [
  { id: "t1", name: "Weekly financial summary", prompt: "Summarize last week’s revenue, expenses and cash position, with anything unusual.", freq: "Weekly · Mon 8:00 AM", next: "Mon, Nov 2 · 8:00 AM", last: "Oct 26 · Completed", on: true },
  { id: "t2", name: "Monthly expense analysis", prompt: "Break down last month’s expenses by category versus budget and flag overspending.", freq: "Monthly · 1st, 9:00 AM", next: "Sun, Nov 1 · 9:00 AM", last: "Oct 1 · Completed", on: true },
  { id: "t3", name: "Revenue report", prompt: "Report revenue by stream and top customers for the week.", freq: "Weekly · Fri 5:00 PM", next: "Fri, Nov 6 · 5:00 PM", last: "Oct 30 · Failed: bank feed disconnected", lastFailed: true, on: true },
  { id: "t4", name: "Cash flow monitoring", prompt: "Check cash against the 3-month reserve and alert me if runway drops below 2 months.", freq: "Daily · 7:00 AM", next: "Sat, Oct 31 · 7:00 AM", last: "Oct 30 · 1 alert", on: true },
  { id: "t5", name: "Quarterly board pack draft", prompt: "Draft the quarterly board pack: P&L, balance sheet, cash flow and commentary.", freq: "Quarterly · 5th, 10:00 AM", next: "Tue, Jan 5 · 10:00 AM", last: "Oct 5 · Completed", on: false },
];

export const NOTIFICATIONS = [
  { tone: "err", title: "Software is 20.5% over its October budget", meta: "Budgets · 2 hours ago", href: "/budgets" },
  { tone: "warn", title: "Your bank feed needs to be reconnected", meta: "Data sources · Yesterday", href: "/data-sources" },
  { tone: "info", title: "Weekly revenue report is ready", meta: "Scheduled task · Yesterday", href: "/reports" },
  { tone: "warn", title: "3 invoices are more than 45 days overdue", meta: "Cash flow monitor · Yesterday", href: "/transactions" },
];

export const INSIGHTS = [
  { tone: "err", tag: "Unusual expense", title: "Travel up 58% on September", text: "$5,120 against $3,240. Two flights were booked less than 7 days before departure.", q: "Why did travel spending jump 58% in October?" },
  { tone: "ok", tag: "Revenue change", title: "Licensing grew 6.1% month over month", text: "Northwind Labs renewed early. Subscriptions also grew 3.1%, led by Lumen Health’s annual plan.", q: "Compare this month's revenue with last month." },
  { tone: "warn", tag: "Cash flow risk", title: "Cash flow fell 12.3% while profit held", text: "$86,400 in receivables is more than 45 days old across three clients.", q: "Identify financial risks in my business." },
  { tone: "info", tag: "Cost saving", title: "14 unused software seats", text: "Across Slack, HubSpot and Figma, worth about $1,180 a month, or $14,160 a year.", q: "Explain my monthly expenses, especially software." },
] as const;

export type SourceStatus = "connected" | "syncing" | "error" | "disconnected";
export type Source = { id: string; name: string; kind: string; detail: string; status: SourceStatus; message?: string; progress?: number };
export const SOURCES: Source[] = [
  { id: "qb", name: "QuickBooks Online", kind: "Accounting", detail: "Harbor & Pine Co. · synced 5 minutes ago", status: "connected" },
  { id: "bank", name: "Commercial Bank of Ethiopia", kind: "Bank feed", detail: "Operating account ··2210", status: "error", message: "Your bank sign-in expired on Oct 29. Reconnect to keep cash figures and transactions current." },
  { id: "stripe", name: "Stripe", kind: "Payments", detail: "Importing 14 months of history", status: "syncing", progress: 64 },
  { id: "xero", name: "Xero", kind: "Accounting", detail: "Use instead of, or alongside, QuickBooks", status: "disconnected" },
  { id: "gusto", name: "Gusto", kind: "Payroll", detail: "Salaries, taxes and benefits", status: "disconnected" },
];

export const UPLOADS = [
  { name: "October_bank_statement.pdf", note: "Read · 214 transactions found", ok: true },
  { name: "Q3_trial_balance.csv", note: "Read · 86 accounts", ok: true },
  { name: "Receipts_scan_Oct.pdf", note: "Couldn’t read this file. It’s password-protected. Remove the password and upload it again.", ok: false },
];

export const CONVERSATIONS = [
  { id: "cash-runway", title: "October cash runway review", kind: "forecast", q: "Generate a cash flow forecast for the next three months." },
  { id: "software-audit", title: "Software spend audit", kind: "expenses", q: "Explain my monthly expenses, especially software." },
  { id: "board-pack", title: "Board pack: September P&L", kind: "report", q: "Create a financial report for the board." },
  { id: "revenue-compare", title: "Revenue: October vs September", kind: "compare", q: "Compare this month's revenue with last month." },
  { id: "receivables-risk", title: "Receivables and client risk", kind: "risks", q: "Identify financial risks in my business." },
  { id: "q3-summary", title: "Q3 performance summary", kind: "performance", q: "Analyze my company's financial performance." },
] as const;
