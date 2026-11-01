import { FINANCIAL_AGENT_TOOLS, ToolDefinition } from "./tools";
import { money } from "@/lib/format";

export interface AgentStep {
  thought: string;
  toolCall?: {
    tool: string;
    args: any;
    result: any;
  };
}

export interface AgentResponse {
  kind: "performance" | "expenses" | "forecast" | "risks" | "compare" | "report" | "nodata" | "files";
  thought: string;
  toolCalls: { tool: string; args: any; result: any }[];
  text: string;
  actionsTaken: string[];
}

export async function runFinancialAgent(prompt: string, mode: string = "Balanced"): Promise<AgentResponse> {
  const p = prompt.toLowerCase();
  const toolCalls: { tool: string; args: any; result: any }[] = [];
  const actionsTaken: string[] = [];
  let thought = "";
  let text = "";
  let kind: AgentResponse["kind"] = "performance";

  // 1. Detect Action: Add Transaction
  const addMatch = prompt.match(/(?:add|record|enter|create)\s+(?:an?\s+)?(?:expense|transaction|payment|income|cost)?\s*(?:of\s+)?\$?([0-9,.]+)\s*(?:for|to|from)?\s*([^.,\n]+)?/i);
  const isIncome = /income|received|paid us|client paid|revenue/i.test(prompt);

  if (addMatch && !/budget|goal|task/i.test(prompt)) {
    const rawAmt = parseFloat(addMatch[1].replace(/,/g, ""));
    const payee = (addMatch[2] || "Manual entry").replace(/\s+(in|under|on|date)\s+.*$/i, "").trim();
    let cat = "Software";
    if (/ads|marketing|campaign/i.test(prompt)) cat = "Marketing";
    else if (/flight|hotel|travel|trip/i.test(prompt)) cat = "Travel";
    else if (/payroll|salary|wage/i.test(prompt)) cat = "Payroll";
    else if (/service|consult/i.test(prompt)) cat = "Services";
    else if (/sub|plan/i.test(prompt)) cat = "Subscriptions";

    const amt = isIncome ? rawAmt : -rawAmt;
    thought = `The user wants to record a financial transaction. I will execute tool addTransaction with amount ${amt} and payee "${payee}".`;

    const res = await FINANCIAL_AGENT_TOOLS.addTransaction.execute({
      name: payee,
      amount: amt,
      category: cat,
      date: new Date().toISOString().split("T")[0],
      memo: `Recorded via Fremwork AI Agent`,
    });

    toolCalls.push({ tool: "addTransaction", args: { name: payee, amount: amt, category: cat }, result: res });
    actionsTaken.push(res.message);

    text = `I have recorded the transaction into your ledger:\n\n* **ID**: \`${res.transaction.id}\`\n* **Payee/Entity**: ${res.transaction.name}\n* **Category**: ${res.transaction.cat}\n* **Amount**: ${amt > 0 ? "+" : ""}${money(amt, 2)}\n* **Status**: Cleared\n\nYour ledger and cash reserve have been updated automatically across your Overview and Transactions tools.`;
    return { kind: "expenses", thought, toolCalls, text, actionsTaken };
  }

  // 2. Detect Action: Create Budget
  const budgetMatch = prompt.match(/(?:set|create|add)\s+(?:a\s+)?budget\s+(?:of\s+)?\$?([0-9,.]+)\s*(?:for|in)?\s*([^.,\n]+)?/i);
  if (budgetMatch) {
    const rawBudget = parseFloat(budgetMatch[1].replace(/,/g, ""));
    const category = (budgetMatch[2] || "Operations").trim();
    thought = `User wants to set a budget limit. Executing tool createBudget for category "${category}" with limit $${rawBudget}.`;

    const res = await FINANCIAL_AGENT_TOOLS.createBudget.execute({
      category,
      budget: rawBudget,
      owner: "Management",
    });

    toolCalls.push({ tool: "createBudget", args: { category, budget: rawBudget }, result: res });
    actionsTaken.push(res.message);

    text = `I have created a new monthly budget limit for **${category}** at **$${rawBudget.toLocaleString()}**.\n\nYou can inspect spending pace and alerts in the Budgets view.`;
    return { kind: "expenses", thought, toolCalls, text, actionsTaken };
  }

  // 3. Scenario Simulation: Hiring / Runway analysis
  if (/hire|what if|scenario|runway if|drop|increase spend/i.test(p)) {
    kind = "forecast";
    const dollarMatch = prompt.match(/\$([0-9,.]+)/);
    const monthCostMatch = prompt.match(/([0-9,.]+)\s*(?:dollars|\/mo|per month|a month)/i);
    const addedCost = dollarMatch
      ? parseFloat(dollarMatch[1].replace(/,/g, ""))
      : monthCostMatch
      ? parseFloat(monthCostMatch[1].replace(/,/g, ""))
      : 16000;

    thought = `Running scenario simulation on company cash and runway with monthly expense change of +$${addedCost.toLocaleString()}. Executing tool runScenarioAnalysis.`;
    const res = await FINANCIAL_AGENT_TOOLS.runScenarioAnalysis.execute({
      monthlyCostChange: addedCost,
      monthlyRevenueChange: 0,
    });

    toolCalls.push({ tool: "runScenarioAnalysis", args: { monthlyCostChange: addedCost }, result: res });

    text = `### Scenario Analysis: Added Outflow of $${addedCost.toLocaleString()}/mo\n\n` +
      `* **Current Cash on Hand**: ${money(res.currentCash)}\n` +
      `* **Baseline Monthly Outflow**: ${money(res.baseMonthlyBurn)}\n` +
      `* **Projected Monthly Outflow**: ${money(res.projectedMonthlyBurn)}\n` +
      `* **Projected Net Cash Flow**: ${money(res.projectedNetMonthly)} / month\n\n` +
      `**Impact on Runway**: Current runway is **${res.currentRunwayMonths} months**. Under this increased expenditure without additional top-line revenue, runway adjusts by **${res.differenceMonths} months** to **${res.projectedRunwayMonths} months**.\n\n` +
      `**Recommendation**: To preserve your 3-month policy reserve, consider staggering start dates or securing early annual renewal prepayments from enterprise accounts.`;

    return { kind, thought, toolCalls, text, actionsTaken };
  }

  // 4. Query Health / Overview / Risks
  if (/risk|danger|overdue|exposure|receivable/i.test(p)) {
    kind = "risks";
    thought = `Checking ledger risks, receivables aging, and customer concentration. Executing getFinancialHealth and searchTransactions.`;
    const health = await FINANCIAL_AGENT_TOOLS.getFinancialHealth.execute({});
    const flagged = await FINANCIAL_AGENT_TOOLS.searchTransactions.execute({ status: "Flagged" });

    toolCalls.push({ tool: "getFinancialHealth", args: {}, result: health });
    toolCalls.push({ tool: "searchTransactions", args: { status: "Flagged" }, result: flagged });

    text = `I have audited your ledger. Current cash reserve stands at **${money(health.cashOnHand)}** (${health.runwayMonths} months of burn). 4 key risk factors require attention: slow collections ($86.4k in overdue invoices), customer concentration, and budget drift in Software and Travel.`;
    return { kind, thought, toolCalls, text, actionsTaken };
  }

  // 5. Query Expenses / Software / Travel
  if (/expens|spend|cost|software|travel|budget/i.test(p)) {
    kind = "expenses";
    thought = `Querying company budgets and October ledger expenses. Executing getBudgetsStatus and searchTransactions.`;
    const budgets = await FINANCIAL_AGENT_TOOLS.getBudgetsStatus.execute({});
    const softwareTx = await FINANCIAL_AGENT_TOOLS.searchTransactions.execute({ category: "Software" });

    toolCalls.push({ tool: "getBudgetsStatus", args: {}, result: budgets });
    toolCalls.push({ tool: "searchTransactions", args: { category: "Software" }, result: softwareTx });

    text = `Total expenses for October came to **${money(246800)}**. Software ran 20.5% over its $8,000 budget due to unassigned seats in Slack, HubSpot, and Figma. Trimming inactive seats recovers approximately $1,180 per month.`;
    return { kind, thought, toolCalls, text, actionsTaken };
  }

  // 6. Forecast
  if (/forecast|runway|projection|predict|how long/i.test(p)) {
    kind = "forecast";
    thought = `Simulating 3-month cash runway and collection schedule. Executing getFinancialHealth.`;
    const health = await FINANCIAL_AGENT_TOOLS.getFinancialHealth.execute({});
    toolCalls.push({ tool: "getFinancialHealth", args: {}, result: health });

    text = `Operating cash flow remains positive. Baseline model projects cash rising from **${money(health.cashOnHand)}** to approximately **$625,900** by January 2027, with December experiencing temporary outflows for year-end bonuses.`;
    return { kind, thought, toolCalls, text, actionsTaken };
  }

  // 7. General Financial Performance / Default
  thought = `Analyzing overall company performance across revenue, net margins, and cash flow conversion. Executing getFinancialHealth.`;
  const health = await FINANCIAL_AGENT_TOOLS.getFinancialHealth.execute({});
  toolCalls.push({ tool: "getFinancialHealth", args: {}, result: health });

  text = `October closed as your strongest revenue month at **${money(health.octoberRevenue)}** (+3.4% MoM). Net profit stood at **${money(health.netProfit)}** with a **${health.netMarginPct}%** net margin. Cash on hand is **${money(health.cashOnHand)}**, providing **${health.runwayMonths} months** of expense runway.`;

  return { kind, thought, toolCalls, text, actionsTaken };
}
