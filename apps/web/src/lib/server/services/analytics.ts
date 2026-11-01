import { getDb } from "../db";
import { MONTHS, REV, EXP, OCF } from "@/lib/data";

export interface FinancialMetrics {
  cash: number;
  months: string[];
  rev: number[];
  exp: number[];
  ocf: number[];
  net: number[];
  streams: {
    Oct: { Subscriptions: number; Services: number; Licensing: number };
    Sep: { Subscriptions: number; Services: number; Licensing: number };
  };
  octoberSummary: {
    revenue: number;
    expenses: number;
    net: number;
    operatingCashFlow: number;
    burnRate: number;
    runwayMonths: number;
  };
}

export const FinancialService = {
  getMetrics(): FinancialMetrics {
    const db = getDb();

    // Query transactions for dynamic aggregation
    const txRows = db.prepare("SELECT amt, cat, date, status FROM transactions WHERE status != 'Failed'").all() as any[];

    let dynOctRev = 0;
    let dynOctExp = 0;
    const streamsOct = { Subscriptions: 148300, Services: 72400, Licensing: 26100 };

    for (const tx of txRows) {
      const amt = Number(tx.amt);
      if (tx.date.startsWith("2026-10")) {
        if (amt > 0) {
          dynOctRev += amt;
          if (tx.cat === "Subscriptions") streamsOct.Subscriptions += amt;
          else if (tx.cat === "Services") streamsOct.Services += amt;
          else if (tx.cat === "Licensing") streamsOct.Licensing += amt;
        } else {
          dynOctExp += Math.abs(amt);
        }
      }
    }

    // Merge baseline with manual dynamic entries
    const revArray = [...REV];
    const expArray = [...EXP];
    const ocfArray = [...OCF];
    const netArray = revArray.map((r, i) => r - expArray[i]);

    const octRevenue = dynOctRev > 0 ? dynOctRev : revArray[revArray.length - 1];
    const octExpense = dynOctExp > 0 ? dynOctExp : expArray[expArray.length - 1];
    const octNet = octRevenue - octExpense;
    const octOcf = ocfArray[ocfArray.length - 1];
    const cash = 412600 + (octNet - (revArray[revArray.length - 1] - expArray[expArray.length - 1]));
    const runwayMonths = +(cash / (octExpense || 1)).toFixed(1);

    return {
      cash,
      months: MONTHS,
      rev: revArray,
      exp: expArray,
      ocf: ocfArray,
      net: netArray,
      streams: {
        Oct: streamsOct,
        Sep: { Subscriptions: 143900, Services: 70100, Licensing: 24600 },
      },
      octoberSummary: {
        revenue: octRevenue,
        expenses: octExpense,
        net: octNet,
        operatingCashFlow: octOcf,
        burnRate: octExpense,
        runwayMonths,
      },
    };
  },
};
