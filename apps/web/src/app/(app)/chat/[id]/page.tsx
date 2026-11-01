"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Copy, Cpu, Download, FileText, FolderPlus, RefreshCw, Wrench } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Answer, Table, Recos } from "@/components/answers";
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
  const [showThought, setShowThought] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(bodyRef.current?.innerText ?? "");
      toast("Answer copied");
    } catch {
      toast("Copy isn’t available here. Select the text instead.", "err");
    }
  };

  return (
    <div className="msg-ai">
      <Mark />
      <div className="ai-body">
        <span className="ai-meta">FREMWORK AGENT · {m.mode.toUpperCase()}</span>
        {m.status === "thinking" && (
          <div className="thinking" role="status">
            <span className="dots" aria-hidden><i /><i /><i /></span>
            {m.mode === "Deep Analysis" ? "Autonomous agent reasoning and running financial scenarios…" : m.mode === "Fast" ? "Querying ledger database…" : "Executing agent tools and analyzing ledger…"}
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
            {/* Agent Thought & Tool Execution Process */}
            {m.thought && (
              <div style={{ background: "var(--rail)", borderRadius: 8, padding: "8px 12px", fontSize: 12.5, color: "var(--ink2)" }}>
                <button
                  type="button"
                  onClick={() => setShowThought(!showThought)}
                  style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 0, fontWeight: 500 }}
                >
                  <Cpu size={14} color="var(--blue)" />
                  <span>Agent Reasoning & Tool Execution</span>
                  {showThought ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                {showThought && (
                  <div style={{ marginTop: 8, borderTop: "1px solid var(--line)", paddingTop: 8, fontFamily: "var(--font-mono, monospace)", fontSize: 12 }}>
                    <p style={{ margin: "0 0 6px" }}>{m.thought}</p>
                    {m.toolCalls && m.toolCalls.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }}>
                        {m.toolCalls.map((tc, idx) => (
                          <div key={idx} style={{ display: "flex", gap: 6, alignItems: "center", color: "var(--ink)" }}>
                            <Wrench size={12} color="var(--blue)" />
                            <span>Executed: <b>{tc.tool}</b>({JSON.stringify(tc.args)})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Actions Confirmed */}
            {m.actionsTaken && m.actionsTaken.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {m.actionsTaken.map((act, idx) => (
                  <Banner key={idx} tone="ok">
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <CheckCircle2 size={14} /> {act}
                    </span>
                  </Banner>
                ))}
              </div>
            )}

            {/* Live Streamed Typed Blocks from NestJS AI Engine */}
            {m.blocks && m.blocks.length > 0 ? (
              <div ref={bodyRef} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {m.blocks.map((blk, idx) => {
                  if (blk.type === "text") {
                    return (
                      <div key={idx} style={{ fontSize: 14.5, lineHeight: 1.6, whiteSpace: "pre-line", color: "var(--ink)" }}>
                        {blk.text}
                      </div>
                    );
                  }
                  if (blk.type === "table") {
                    return <Table key={idx} head={blk.head} rows={blk.rows} foot={blk.foot} />;
                  }
                  if (blk.type === "calc") {
                    return (
                      <pre key={idx} className="calc">
                        {blk.working}
                        {"\n\nResult: "}{blk.result}
                      </pre>
                    );
                  }
                  if (blk.type === "recommendation") {
                    return <Recos key={idx} items={blk.items} />;
                  }
                  return null;
                })}
              </div>
            ) : (
              <>
                {/* Agent Dynamic Text */}
                {m.text && (
                  <div style={{ fontSize: 14.5, lineHeight: 1.6, whiteSpace: "pre-line", color: "var(--ink)" }}>
                    {m.text}
                  </div>
                )}

                {/* Rich Charts & Calculation Cards */}
                <div ref={bodyRef} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <Answer kind={m.kind} fileName={m.fileName} />
                </div>
              </>
            )}

            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              <button className="btn sm ghost" onClick={copy}><Copy size={14} />Copy</button>
              <button className="btn sm ghost" onClick={() => toast("Exporting report...")}><Download size={14} />PDF</button>
              <button className="btn sm ghost" onClick={() => toast("Exporting Excel...")}><Download size={14} />XLSX</button>
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

      <div className="thread-messages">
        <div className="thread-center">
          {convo.messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="msg-user">
                <div className="user-bubble">{m.text}</div>
              </div>
            ) : (
              <AiMessage key={m.id} m={m} convoId={convo.id} />
            )
          )}
          <div ref={endRef} />
        </div>
      </div>

      <div className="thread-composer">
        <div className="composer-center">
          <Composer
            busy={busy}
            onSend={(text, files) => {
              send(convo.id, text, files);
            }}
            onStop={() => {
              if (last && last.role === "ai") stop(convo.id, last.id);
            }}
          />
        </div>
      </div>

      {picker && (
        <Modal
          title="Add to project"
          sub="Group this conversation with related files and reports."
          onClose={() => setPicker(false)}
          footer={
            <>
              <button className="btn" onClick={() => setPicker(false)}>Cancel</button>
              <button
                className="btn primary"
                onClick={() => {
                  addToProject(convo.id, projectId);
                  setPicker(false);
                  toast(`Added to ${PROJECTS.find((p) => p.id === projectId)?.name}`);
                }}
              >
                Add to project
              </button>
            </>
          }
        >
          <div className="dialog-body">
            <Field id="proj-pick" label="Choose project">
              {(a) => (
                <select {...a} className="select" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                  {PROJECTS.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}
            </Field>
          </div>
        </Modal>
      )}
    </>
  );
}
