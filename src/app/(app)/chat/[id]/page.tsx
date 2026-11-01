"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, Copy, Download, FileText, FolderPlus, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Answer } from "@/components/answers";
import { useChat, type Message } from "@/components/chat-store";
import { Composer } from "@/components/composer";
import { Modal } from "@/components/dialog";
import { useToast } from "@/components/toast";
import { Banner, Empty, Field, Mark } from "@/components/ui";
import { PROJECTS } from "@/lib/data";

function AiMessage({ m, convoId }: { m: Extract<Message, { role: "ai" }>; convoId: string }) {
  const { stop, retry, usage } = useChat();
  const toast = useToast();
  const bodyRef = useRef<HTMLDivElement>(null);
  const copy = async () => {
    try { await navigator.clipboard.writeText(bodyRef.current?.innerText ?? ""); toast("Answer copied"); }
    catch { toast("Copy isn’t available here. Select the text instead.", "err"); }
  };
  return (
    <div className="msg-ai">
      <Mark />
      <div className="ai-body">
        <span className="ai-meta">FREMWORK · {m.mode.toUpperCase()}</span>
        {m.status === "thinking" && (
          <div className="thinking" role="status">
            <span className="dots" aria-hidden><i /><i /><i /></span>
            {m.mode === "Deep Analysis" ? "Building scenarios from your ledger…" : m.mode === "Fast" ? "Reading your ledger…" : "Analyzing your ledger and checking the math…"}
            <button className="btn sm ghost" onClick={() => stop(convoId, m.id)}>Stop</button>
          </div>
        )}
        {m.status === "error" && (
          <Banner tone="err" title="Fremwork couldn’t finish this answer." action={<button className="btn sm" onClick={() => retry(convoId, m.id)}><RefreshCw size={14} />Retry</button>}>
            The connection dropped before the answer was ready. Nothing was lost. Check you’re online, then retry.
          </Banner>
        )}
        {m.status === "stopped" && (
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span className="muted">You stopped this answer.</span>
            <button className="btn sm" onClick={() => retry(convoId, m.id)}><RefreshCw size={14} />Regenerate</button>
          </div>
        )}
        {m.status === "limit" && (
          <Banner tone="warn" title="You’ve used all your analyses for this month." action={<Link className="btn sm primary" href="/settings?tab=billing">Upgrade</Link>}>
            Your Pro plan includes {usage.limit.toLocaleString()} a month, and it resets on Nov 14. Upgrade to Business to keep going now.
          </Banner>
        )}
        {m.status === "done" && (
          <>
            <div ref={bodyRef} style={{ display: "flex", flexDirection: "column", gap: 14 }}><Answer kind={m.kind} fileName={m.fileName} /></div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              <button className="btn sm ghost" onClick={copy}><Copy size={14} />Copy</button>
              <button className="btn sm ghost" onClick={() => toast("PDF export arrives with the backend")}><Download size={14} />PDF</button>
              <button className="btn sm ghost" onClick={() => toast("XLSX export arrives with the backend")}><Download size={14} />XLSX</button>
              <button className="btn sm ghost" onClick={() => toast("Saved to Financial Reports")}><FileText size={14} />Save to reports</button>
              <button className="btn sm ghost" aria-label="Regenerate" onClick={() => retry(convoId, m.id)}><RefreshCw size={14} /></button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function Thread() {
  const { id } = useParams<{ id: string }>();
  const { conversations, send, stop, addToProject } = useChat();
  const toast = useToast();
  const convo = conversations.find((c) => c.id === id);
  const [picker, setPicker] = useState(false);
  const [projectId, setProjectId] = useState(PROJECTS[0].id);
  const endRef = useRef<HTMLDivElement>(null);
  const count = convo?.messages.length ?? 0;
  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [count, convo?.messages.at(-1)]);

  if (!convo) {
    return (
      <div className="page">
        <div className="card" style={{ maxWidth: 560, margin: "48px auto 0" }}>
          <Empty icon={<AlertTriangle size={18} />} title="We can’t find this chat." action={<Link href="/chat" className="btn primary">Start a new chat</Link>}>
            It may have been deleted, or the link is from another account.
          </Empty>
        </div>
      </div>
    );
  }
  const last = convo.messages.at(-1);
  const busy = last?.role === "ai" && last.status === "thinking";
  const project = PROJECTS.find((p) => p.id === convo.projectId);

  return (
    <>
      <div className="thread-head">
        <h1>{convo.title}</h1>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {project && <Link href={`/projects/${project.id}`} className="status">{project.name}</Link>}
          <button className="btn sm ghost" onClick={() => setPicker(true)}><FolderPlus size={16} /><span>Add to project</span></button>
        </div>
      </div>
      <main className="thread" aria-live="polite">
        {convo.messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="msg-user">
              {m.text}
              {m.files.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {m.files.map((f) => <span key={f.name} className="file-chip"><span className="tag solid">{f.ext}</span><span className="name">{f.name}</span></span>)}
                </div>
              )}
            </div>
          ) : (
            <AiMessage key={m.id} m={m} convoId={convo.id} />
          )
        )}
        <div ref={endRef} />
      </main>
      <div className="dock">
        <Composer docked busy={busy} onStop={() => last && stop(convo.id, last.id)} onSend={(t, f) => send(convo.id, t, f)} />
        <p className="dock-note">Fremwork uses demo data in this preview. Check important figures before acting on them.</p>
      </div>
      {picker && (
        <Modal title="Add to project" sub={convo.title} onClose={() => setPicker(false)}
          footer={<><button className="btn" onClick={() => setPicker(false)}>Cancel</button><button className="btn primary" onClick={() => { addToProject(convo.id, projectId); setPicker(false); toast(`Added to ${PROJECTS.find((p) => p.id === projectId)?.name}`); }}>Add</button></>}>
          <div className="dialog-body">
            <Field id="pick-project" label="Project">{(a) => <select {...a} className="select" value={projectId} onChange={(e) => setProjectId(e.target.value)}>{PROJECTS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>}</Field>
          </div>
        </Modal>
      )}
    </>
  );
}
