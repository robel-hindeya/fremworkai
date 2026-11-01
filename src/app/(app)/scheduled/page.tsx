"use client";

import Link from "next/link";
import { Pause, Play, Plus, RotateCcw } from "lucide-react";
import { useState } from "react";
import { TaskDialog } from "@/components/forms";
import { useToast } from "@/components/toast";
import { Banner, PageHeader, Status } from "@/components/ui";
import { TASKS, type Task } from "@/lib/data";

export default function Scheduled() {
  const [tasks, setTasks] = useState<Task[]>(TASKS);
  const [creating, setCreating] = useState(false);
  const [running, setRunning] = useState<string | null>(null);
  const toast = useToast();
  const set = (id: string, patch: Partial<Task>) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const run = (t: Task) => {
    if (running) { toast("Another task is running. Try again when it finishes.", "err"); return; }
    setRunning(t.id);
    set(t.id, { last: "Running now…", lastFailed: false });
    setTimeout(() => {
      // The revenue report depends on the bank feed, which is disconnected in the demo.
      const fail = t.id === "t3";
      set(t.id, { last: fail ? "Just now · Failed: bank feed disconnected" : "Just now · Completed", lastFailed: fail });
      setRunning(null);
      toast(fail ? `${t.name} failed. Reconnect your bank feed and run it again.` : `${t.name} finished. Results are in your notifications.`, fail ? "err" : "ok");
    }, 1800);
  };
  const active = tasks.filter((t) => t.on).length;
  const failing = tasks.filter((t) => t.lastFailed);

  return (
    <div className="page">
      <PageHeader eyebrow="Workspace" title="Scheduled tasks" sub="Recurring analyses Fremwork runs for you and delivers to your inbox." demo={false}
        actions={<button className="btn primary" onClick={() => setCreating(true)}><Plus size={16} />New task</button>} />
      {failing.length > 0 && <Banner tone="err" title={`${failing.map((t) => t.name).join(", ")} failed on its last run.`} action={<Link className="btn sm" href="/data-sources">Fix in Data sources</Link>}>The bank feed it reads from is disconnected.</Banner>}
      <section className="card" style={{ overflow: "hidden" }}>
        <div className="card-head"><div><h2>{active} active · {tasks.length - active} paused</h2><p>Times shown in your time zone</p></div></div>
        <div className="table-wrap">
          <table className="t" style={{ minWidth: 900 }}>
            <thead><tr><th>Task</th><th>Frequency</th><th>Next run</th><th>Last run</th><th>Status</th><th className="r">Actions</th></tr></thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id}>
                  <td style={{ whiteSpace: "normal", minWidth: 260 }}><b style={{ fontWeight: 500 }}>{t.name}</b><div className="muted" style={{ fontSize: 12.5, maxWidth: "44ch" }}>{t.prompt}</div></td>
                  <td>{t.freq}</td>
                  <td className="num" style={{ color: t.on ? undefined : "var(--muted)" }}>{t.on ? t.next : "Paused"}</td>
                  <td style={{ color: t.lastFailed ? "var(--neg)" : "var(--muted)" }}>{t.last}</td>
                  <td><Status tone={t.lastFailed ? "err" : t.on ? "ok" : ""}>{t.lastFailed ? "Failed" : t.on ? "Active" : "Paused"}</Status></td>
                  <td className="r" style={{ whiteSpace: "nowrap" }}>
                    <button className="icon-btn" aria-label={t.lastFailed ? `Retry ${t.name}` : `Run ${t.name} now`} title={t.lastFailed ? "Retry" : "Run now"} disabled={running === t.id} onClick={() => run(t)}>{t.lastFailed ? <RotateCcw size={16} /> : <Play size={16} />}</button>
                    <button className="btn sm" onClick={() => { set(t.id, { on: !t.on }); toast(`${t.name} ${t.on ? "paused" : "resumed"}`); }}>{t.on ? <><Pause size={14} />Pause</> : <><Play size={14} />Resume</>}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {creating && <TaskDialog onClose={() => setCreating(false)} onAdd={(n) => setTasks((ts) => [{ id: "t" + Date.now(), name: n.name, prompt: n.prompt, freq: `${n.freq} · ${n.time}`, next: n.freq === "Daily" ? `Tomorrow · ${n.time}` : `Mon, Nov 2 · ${n.time}`, last: "Never run", on: true }, ...ts])} />}
    </div>
  );
}
