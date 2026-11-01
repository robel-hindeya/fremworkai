"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { api } from "./api";
import {
  CATS as DEFAULT_CATS,
  GOALS as DEFAULT_GOALS,
  PROJECTS as DEFAULT_PROJECTS,
  SOURCES as DEFAULT_SOURCES,
  TASKS as DEFAULT_TASKS,
  TRANSACTIONS as DEFAULT_TXS,
  type BudgetCat,
  type Goal,
  type Project,
  type Source,
  type Task,
  type Tx,
} from "@/lib/data";

export interface FinancialSummary {
  cash: number;
  months: string[];
  rev: number[];
  exp: number[];
  ocf: number[];
  net: number[];
  streams: {
    Oct: Record<string, number>;
    Sep: Record<string, number>;
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

interface DataContextType {
  transactions: Tx[];
  budgets: (BudgetCat & { id?: string })[];
  goals: Goal[];
  projects: Project[];
  tasks: Task[];
  dataSources: Source[];
  metrics: FinancialSummary | null;
  loading: boolean;
  error: string | null;
  // Transactions
  addTransaction: (tx: { name: string; amt: number; cat: string; date: string; method: string; memo: string }) => Promise<Tx>;
  updateTransaction: (tx: Tx) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  // Budgets
  addBudget: (b: { k: string; budget: number; owner: string; alert?: string }) => Promise<void>;
  updateBudget: (id: string, patch: Partial<BudgetCat>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  // Goals
  addGoal: (g: { type: string; name: string; cur: number; target: number; date: string; down?: boolean }) => Promise<void>;
  updateGoal: (id: string, patch: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  // Projects
  addProject: (p: { name: string; desc: string }) => Promise<Project>;
  updateProject: (id: string, patch: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  // Tasks
  addTask: (t: { name: string; prompt: string; freq: string; next?: string }) => Promise<void>;
  updateTask: (id: string, patch: Partial<Task>) => Promise<void>;
  runTask: (id: string) => Promise<{ success: boolean; message: string }>;
  deleteTask: (id: string) => Promise<void>;
  // Data Sources
  syncDataSource: (id: string) => Promise<void>;
  // Refresh
  refresh: () => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Tx[]>(DEFAULT_TXS);
  const [budgets, setBudgets] = useState<(BudgetCat & { id?: string })[]>(DEFAULT_CATS);
  const [goals, setGoals] = useState<Goal[]>(DEFAULT_GOALS);
  const [projects, setProjects] = useState<Project[]>(DEFAULT_PROJECTS);
  const [tasks, setTasks] = useState<Task[]>(DEFAULT_TASKS);
  const [dataSources, setDataSources] = useState<Source[]>(DEFAULT_SOURCES);
  const [metrics, setMetrics] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [txs, bgs, gls, prjs, tsks, srcs, met] = await Promise.all([
        api.get<any[]>("/api/transactions").catch(() => DEFAULT_TXS),
        api.get<any[]>("/api/budgets").catch(() => DEFAULT_CATS),
        api.get<any[]>("/api/goals").catch(() => DEFAULT_GOALS),
        api.get<any[]>("/api/projects").catch(() => DEFAULT_PROJECTS),
        api.get<any[]>("/api/scheduled").catch(() => DEFAULT_TASKS),
        api.get<any[]>("/api/data-sources").catch(() => DEFAULT_SOURCES),
        api.get<FinancialSummary>("/api/analytics").catch(() => null),
      ]);

      // Normalize transactions
      const mappedTxs: Tx[] = (Array.isArray(txs) && txs.length ? txs : DEFAULT_TXS).map((t: any) => ({
        id: t.id,
        name: t.payee || t.name || "Manual entry",
        memo: t.memo || "",
        cat: t.categoryName || t.cat || "Software",
        date: t.date,
        amt: t.amountMinor !== undefined ? t.amountMinor / 100 : (t.amt ?? 0),
        status: (t.status ? (t.status.charAt(0).toUpperCase() + t.status.slice(1)) : "Cleared") as any,
        method: t.method || "Bank transfer",
      }));

      // Normalize budgets
      const mappedBudgets = (Array.isArray(bgs) && bgs.length ? bgs : DEFAULT_CATS).map((b: any) => ({
        id: b.id,
        k: b.categoryName || b.k || "General",
        budget: b.amountMinor !== undefined ? b.amountMinor / 100 : (b.budget ?? 0),
        oct: b.spentMinor !== undefined ? b.spentMinor / 100 : (b.oct ?? 0),
        sep: b.sep ?? 0,
        owner: b.ownerLabel || b.owner || "Finance",
        alert: b.alert,
      }));

      // Normalize goals
      const mappedGoals: Goal[] = (Array.isArray(gls) && gls.length ? gls : DEFAULT_GOALS).map((g: any) => ({
        id: g.id,
        type: g.type,
        name: g.name,
        cur: g.currentMinor !== undefined ? g.currentMinor / 100 : (g.cur ?? 0),
        target: g.targetMinor !== undefined ? g.targetMinor / 100 : (g.target ?? 0),
        start: g.startMinor !== undefined ? g.startMinor / 100 : (g.start ?? 0),
        date: g.targetDate || g.date,
        down: g.down,
        status: g.status,
        ai: g.aiGuidance || g.ai || "Tracking pace toward goal.",
      }));

      // Normalize tasks
      const mappedTasks: Task[] = (Array.isArray(tsks) && tsks.length ? tsks : DEFAULT_TASKS).map((t: any) => ({
        id: t.id,
        name: t.name,
        prompt: t.prompt,
        freq: t.cron ? `Cron: ${t.cron}` : (t.freq || "Weekly"),
        next: t.nextRunAt || t.next || "Next cycle",
        last: t.lastRunStatus ? `Status: ${t.lastRunStatus}` : (t.last || "Completed"),
        lastFailed: t.lastRunStatus === "failed" || t.lastFailed,
        on: t.enabled ?? t.on ?? true,
      }));

      // Normalize data sources
      const mappedSources: Source[] = (Array.isArray(srcs) && srcs.length ? srcs : DEFAULT_SOURCES).map((s: any) => ({
        id: s.id,
        name: s.name,
        kind: s.provider || s.kind || "bank",
        detail: s.detail || "",
        status: s.status,
        message: s.lastRunError || s.errorCode || s.message,
        progress: s.progress,
      }));

      // Normalize projects
      const mappedProjects: Project[] = (Array.isArray(prjs) && prjs.length ? prjs : DEFAULT_PROJECTS).map((p: any) => ({
        id: p.id,
        name: p.name,
        desc: p.description || p.desc || "",
        chats: p.chats || [],
        docs: p.docs || [],
        reports: p.reports || [],
        updated: p.updatedAt || p.updated || "Recently",
      }));

      setTransactions(mappedTxs);
      setBudgets(mappedBudgets);
      setGoals(mappedGoals);
      setProjects(mappedProjects);
      setTasks(mappedTasks);
      setDataSources(mappedSources);
      if (met) setMetrics(met);
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Transactions Actions
  const addTransaction = useCallback(
    async (tx: { name: string; amt: number; cat: string; date: string; method: string; memo: string }) => {
      const tempId = `TX-${Math.floor(10000 + Math.random() * 90000)}`;
      const optimisticTx: Tx = { ...tx, id: tempId, status: "Cleared" };
      setTransactions((prev) => [optimisticTx, ...prev]);

      try {
        const created = await api.post<any>("/api/transactions", {
          payee: tx.name,
          name: tx.name,
          amt: tx.amt,
          amountMinor: Math.round(tx.amt * 100),
          categoryName: tx.cat,
          cat: tx.cat,
          date: tx.date,
          method: tx.method,
          memo: tx.memo,
        });

        const mapped: Tx = {
          id: created.id || tempId,
          name: created.payee || created.name || tx.name,
          amt: created.amountMinor !== undefined ? created.amountMinor / 100 : (created.amt ?? tx.amt),
          cat: created.categoryName || created.cat || tx.cat,
          date: created.date || tx.date,
          method: created.method || tx.method,
          memo: created.memo || tx.memo,
          status: (created.status ? (created.status.charAt(0).toUpperCase() + created.status.slice(1)) : "Cleared") as any,
        };

        setTransactions((prev) => prev.map((t) => (t.id === tempId ? mapped : t)));
        api.get<FinancialSummary>("/api/analytics").then(setMetrics).catch(() => {});
        return mapped;
      } catch (e) {
        setTransactions((prev) => prev.filter((t) => t.id !== tempId));
        throw e;
      }
    },
    []
  );

  const updateTransaction = useCallback(async (tx: Tx) => {
    setTransactions((prev) => prev.map((t) => (t.id === tx.id ? tx : t)));
    try {
      await api.put(`/api/transactions/${tx.id}`, {
        ...tx,
        payee: tx.name,
        categoryName: tx.cat,
        amountMinor: Math.round(tx.amt * 100),
      });
    } catch (e) {
      refresh();
      throw e;
    }
  }, [refresh]);

  const deleteTransaction = useCallback(async (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    try {
      await api.delete(`/api/transactions/${id}`);
      api.get<FinancialSummary>("/api/analytics").then(setMetrics).catch(() => {});
    } catch (e) {
      refresh();
      throw e;
    }
  }, [refresh]);

  // Budgets Actions
  const addBudget = useCallback(
    async (b: { k: string; budget: number; owner: string; alert?: string }) => {
      const tempItem = { id: `b-${Date.now()}`, k: b.k, oct: 0, sep: 0, budget: b.budget, owner: b.owner, alert: b.alert };
      setBudgets((prev) => [...prev, tempItem]);
      try {
        const created = await api.post<any>("/api/budgets", {
          categoryName: b.k,
          budget: b.budget,
          amountMinor: Math.round(b.budget * 100),
          ownerLabel: b.owner,
        });
        setBudgets((prev) => prev.map((item) => (item.k === b.k ? { ...item, id: created.id } : item)));
      } catch (e) {
        refresh();
        throw e;
      }
    },
    [refresh]
  );

  const updateBudget = useCallback(async (id: string, patch: Partial<BudgetCat>) => {
    setBudgets((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    try {
      await api.put(`/api/budgets/${id}`, {
        ...patch,
        ...(patch.budget !== undefined ? { amountMinor: Math.round(patch.budget * 100) } : {}),
        ...(patch.k !== undefined ? { categoryName: patch.k } : {}),
      });
    } catch (e) {
      refresh();
      throw e;
    }
  }, [refresh]);

  const deleteBudget = useCallback(async (id: string) => {
    setBudgets((prev) => prev.filter((b) => b.id !== id));
    try {
      await api.delete(`/api/budgets/${id}`);
    } catch (e) {
      refresh();
      throw e;
    }
  }, [refresh]);

  // Goals Actions
  const addGoal = useCallback(
    async (g: { type: string; name: string; cur: number; target: number; date: string; down?: boolean }) => {
      const tempId = `g-${Date.now()}`;
      const optimistic: Goal = {
        id: tempId,
        type: g.type,
        name: g.name,
        cur: g.cur,
        target: g.target,
        start: g.cur,
        date: g.date,
        down: g.down,
        status: "On track",
        ai: "Tracking pace toward goal.",
      };
      setGoals((prev) => [...prev, optimistic]);
      try {
        const created = await api.post<any>("/api/goals", {
          type: g.type,
          name: g.name,
          currentMinor: Math.round(g.cur * 100),
          targetMinor: Math.round(g.target * 100),
          targetDate: g.date,
        });
        setGoals((prev) => prev.map((item) => (item.id === tempId ? { ...optimistic, id: created.id } : item)));
      } catch (e) {
        refresh();
        throw e;
      }
    },
    [refresh]
  );

  const updateGoal = useCallback(async (id: string, patch: Partial<Goal>) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
    try {
      await api.put(`/api/goals/${id}`, patch);
    } catch (e) {
      refresh();
      throw e;
    }
  }, [refresh]);

  const deleteGoal = useCallback(async (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    try {
      await api.delete(`/api/goals/${id}`);
    } catch (e) {
      refresh();
      throw e;
    }
  }, [refresh]);

  // Projects Actions
  const addProject = useCallback(
    async (p: { name: string; desc: string }) => {
      const tempId = `p-${Date.now()}`;
      const optimistic: Project = { id: tempId, name: p.name, desc: p.desc, chats: [], docs: [], reports: [], updated: "Just now" };
      setProjects((prev) => [...prev, optimistic]);
      try {
        const created = await api.post<any>("/api/projects", {
          name: p.name,
          description: p.desc,
        });
        const mapped: Project = {
          id: created.id || tempId,
          name: created.name || p.name,
          desc: created.description || p.desc,
          chats: created.chats || [],
          docs: created.docs || [],
          reports: created.reports || [],
          updated: created.updatedAt || "Just now",
        };
        setProjects((prev) => prev.map((item) => (item.id === tempId ? mapped : item)));
        return mapped;
      } catch (e) {
        refresh();
        throw e;
      }
    },
    [refresh]
  );

  const updateProject = useCallback(async (id: string, patch: Partial<Project>) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    try {
      await api.put(`/api/projects/${id}`, patch);
    } catch (e) {
      refresh();
      throw e;
    }
  }, [refresh]);

  const deleteProject = useCallback(async (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    try {
      await api.delete(`/api/projects/${id}`);
    } catch (e) {
      refresh();
      throw e;
    }
  }, [refresh]);

  // Tasks Actions
  const addTask = useCallback(
    async (t: { name: string; prompt: string; freq: string; next?: string }) => {
      const tempId = `t-${Date.now()}`;
      const optimistic: Task = { id: tempId, name: t.name, prompt: t.prompt, freq: t.freq, next: t.next || "Next cycle", last: "Not run yet", on: true };
      setTasks((prev) => [...prev, optimistic]);
      try {
        const created = await api.post<any>("/api/scheduled", {
          name: t.name,
          prompt: t.prompt,
          nextRunAt: t.next,
          enabled: true,
        });
        setTasks((prev) => prev.map((item) => (item.id === tempId ? { ...optimistic, id: created.id } : item)));
      } catch (e) {
        refresh();
        throw e;
      }
    },
    [refresh]
  );

  const updateTask = useCallback(async (id: string, patch: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    try {
      await api.put(`/api/scheduled/${id}`, {
        ...patch,
        ...(patch.on !== undefined ? { enabled: patch.on } : {}),
      });
    } catch (e) {
      refresh();
      throw e;
    }
  }, [refresh]);

  const runTask = useCallback(async (id: string) => {
    try {
      const res = await api.post<any>(`/api/scheduled/${id}/run`);
      if (res.task || res.data) {
        const updated = res.task || res.data;
        setTasks((prev) =>
          prev.map((t) =>
            t.id === id
              ? {
                  ...t,
                  last: updated.lastRunStatus ? `Status: ${updated.lastRunStatus}` : "Completed",
                  lastFailed: updated.lastRunStatus === "failed",
                }
              : t
          )
        );
      }
      return { success: res.success !== false, message: res.message || "Executed" };
    } catch (e: any) {
      return { success: false, message: e.message || "Execution error" };
    }
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await api.delete(`/api/scheduled/${id}`);
    } catch (e) {
      refresh();
      throw e;
    }
  }, [refresh]);

  // Data Sources Actions
  const syncDataSource = useCallback(async (id: string) => {
    setDataSources((prev) => prev.map((s) => (s.id === id ? { ...s, status: "syncing", progress: 50 } : s)));
    try {
      const res = await api.post<any>(`/api/data-sources/${id}/sync`);
      if (res.data || res.source) {
        const updated = res.data || res.source;
        setDataSources((prev) =>
          prev.map((s) =>
            s.id === id
              ? {
                  ...s,
                  status: updated.status,
                  message: updated.errorCode || undefined,
                  detail: updated.detail || "Synced just now",
                }
              : s
          )
        );
      }
    } catch (e) {
      refresh();
      throw e;
    }
  }, [refresh]);

  const value = useMemo(
    () => ({
      transactions,
      budgets,
      goals,
      projects,
      tasks,
      dataSources,
      metrics,
      loading,
      error,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addBudget,
      updateBudget,
      deleteBudget,
      addGoal,
      updateGoal,
      deleteGoal,
      addProject,
      updateProject,
      deleteProject,
      addTask,
      updateTask,
      runTask,
      deleteTask,
      syncDataSource,
      refresh,
    }),
    [
      transactions,
      budgets,
      goals,
      projects,
      tasks,
      dataSources,
      metrics,
      loading,
      error,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addBudget,
      updateBudget,
      deleteBudget,
      addGoal,
      updateGoal,
      deleteGoal,
      addProject,
      updateProject,
      deleteProject,
      addTask,
      updateTask,
      runTask,
      deleteTask,
      syncDataSource,
      refresh,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error("useData must be used within a DataProvider");
  }
  return ctx;
}
