"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowDown,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  Cpu,
  Download,
  FileSpreadsheet,
  FileText,
  FolderPlus,
  RefreshCw,
  Sparkles,
  Square,
  SquarePen,
  Wrench,
} from "lucide-react";
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
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      const textToCopy = bodyRef.current?.innerText ?? m.text ?? "";
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast("Answer copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Copy isn’t available here. Select the text instead.", "err");
    }
  };

  return (
    <div className="msg-ai-row">
      <div className="msg-ai-avatar">
        <Mark size={18} />
      </div>
      <div className="msg-ai-body">
        <div className="msg-ai-meta">
          <span className="msg-ai-name">Fremwork</span>
          <span className="msg-ai-badge">{m.mode}</span>
        </div>

        {m.status === "thinking" && (
          <div className="chat-thinking-box" role="status">
            <div className="thinking-pulsar">
              <span className="pulse-dot" />
              <span className="pulse-dot" />
              <span className="pulse-dot" />
            </div>
            <span className="thinking-text">
              {m.mode === "Deep Analysis"
                ? "Autonomous agent reasoning and running financial scenarios…"
                : m.mode === "Fast"
                ? "Querying ledger database…"
                : "Executing agent tools and analyzing ledger…"}
            </span>
            <button className="btn sm ghost stop-btn" onClick={() => stop(convoId, m.id)}>
              <Square size={11} fill="currentColor" /> Stop
            </button>
          </div>
        )}

        {m.status === "error" && (
          <Banner
            tone="err"
            title="Fremwork couldn’t finish this answer."
            action={
              <button className="btn sm" onClick={() => retry(convoId, m.id)}>
                <RefreshCw size={14} /> Retry
              </button>
            }
          >
            The connection dropped before the answer was ready. Nothing was lost. Check you’re online, then retry.
          </Banner>
        )}

        {m.status === "stopped" && (
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span className="muted">You stopped this answer.</span>
            <button className="btn sm" onClick={() => retry(convoId, m.id)}>
              <RefreshCw size={14} /> Regenerate
            </button>
          </div>
        )}

        {m.status === "limit" && (
          <Banner
            tone="warn"
            title="You’ve used all your analyses for this month."
            action={
              <Link className="btn sm primary" href="/settings?tab=billing">
                Upgrade
              </Link>
            }
          >
            Your Pro plan includes {usage.limit.toLocaleString()} a month, and it resets on Nov 14. Upgrade to Business to keep going now.
          </Banner>
        )}

        {m.status === "done" && (
          <>
            {/* Agent Thought & Tool Execution Process (ChatGPT o1/o3 style) */}
            {m.thought && (
              <div className="thought-accordion">
                <button
                  type="button"
                  className="thought-toggle"
                  onClick={() => setShowThought(!showThought)}
                >
                  <Sparkles size={14} color="var(--blue)" />
                  <span style={{ flex: 1 }}>Reasoning Process &amp; Tool Execution</span>
                  {showThought ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                {showThought && (
                  <div className="thought-details">
                    <p style={{ margin: "0 0 6px" }}>{m.thought}</p>
                    {m.toolCalls && m.toolCalls.length > 0 && (
                      <div className="thought-tools">
                        {m.toolCalls.map((tc, idx) => (
                          <div key={idx} className="tool-call-row">
                            <Wrench size={12} />
                            <span>
                              Executed: <b>{tc.tool}</b>({JSON.stringify(tc.args)})
                            </span>
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
                      <div key={idx} style={{ fontSize: 15.5, lineHeight: 1.65, whiteSpace: "pre-line", color: "var(--ink)" }}>
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
                  <div style={{ fontSize: 15.5, lineHeight: 1.65, whiteSpace: "pre-line", color: "var(--ink)" }}>
                    {m.text}
                  </div>
                )}

                {/* Rich Charts & Calculation Cards */}
                <div ref={bodyRef} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <Answer kind={m.kind} fileName={m.fileName} />
                </div>
              </>
            )}

            {/* Action Buttons Bar */}
            <div className="ai-actions-bar">
              <button className="ai-action-btn" onClick={copy} title={copied ? "Copied!" : "Copy response"}>
                {copied ? <Check size={14} color="var(--pos)" /> : <Copy size={14} />}
                <span className="action-label">{copied ? "Copied" : "Copy"}</span>
              </button>
              <button className="ai-action-btn" onClick={() => toast("Exporting PDF report...")} title="Export as PDF">
                <Download size={14} />
                <span className="action-label">PDF</span>
              </button>
              <button className="ai-action-btn" onClick={() => toast("Exporting Excel spreadsheet...")} title="Export as Excel">
                <FileSpreadsheet size={14} />
                <span className="action-label">XLSX</span>
              </button>
              <button className="ai-action-btn" onClick={() => toast("Saved to Financial Reports")} title="Save to reports">
                <FileText size={14} />
                <span className="action-label">Save</span>
              </button>
              <button className="ai-action-btn" onClick={() => retry(convoId, m.id)} title="Regenerate answer">
                <RefreshCw size={14} />
                <span className="action-label">Regenerate</span>
              </button>
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const count = convo?.messages.length ?? 0;
  const last = convo?.messages.at(-1);
  const busy = last?.role === "ai" && last.status === "thinking";
  const project = PROJECTS.find((p) => p.id === convo?.projectId);

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [count, last?.role === "ai" ? last.status : null]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollBottom(distanceToBottom > 160);
  };

  if (!convo) {
    return (
      <div className="page">
        <div className="card" style={{ maxWidth: 560, margin: "48px auto 0" }}>
          <Empty
            icon={<AlertTriangle size={18} />}
            title="We can’t find this chat."
            action={<Link href="/chat" className="btn primary">Start a new chat</Link>}
          >
            It may have been deleted, or the link is from another account.
          </Empty>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-layout">
      <header className="chat-top-bar">
        <div className="chat-top-left">
          <div className="chat-model-pill">
            <span className="chat-model-name">Fremwork 1.0</span>
            <span className="chat-mode-tag">{last?.role === "ai" ? last.mode : "Balanced"}</span>
          </div>
          <div className="chat-title-divider" />
          <h1 className="chat-top-title" title={convo.title}>{convo.title}</h1>
        </div>
        <div className="chat-top-right">
          {project && <Link href={`/projects/${project.id}`} className="status ok">{project.name}</Link>}
          <button className="btn sm ghost" onClick={() => setPicker(true)} title="Add to project">
            <FolderPlus size={15} />
            <span className="hide-mobile">Project</span>
          </button>
          <Link href="/chat" className="btn sm ghost" title="New chat">
            <SquarePen size={15} />
            <span className="hide-mobile">New chat</span>
          </Link>
        </div>
      </header>

      <div className="thread-messages" ref={scrollContainerRef} onScroll={handleScroll}>
        <div className="thread-center">
          {convo.messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="msg-user-row">
                <div className="msg-user-bubble">
                  {m.files && m.files.length > 0 && (
                    <div className="msg-user-files">
                      {m.files.map((f, i) => (
                        <div key={i} className="msg-file-pill">
                          <span className="file-tag">{f.ext}</span>
                          <span className="file-name">{f.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="msg-user-text">{m.text}</div>
                </div>
              </div>
            ) : (
              <AiMessage key={m.id} m={m} convoId={convo.id} />
            )
          )}
          <div ref={endRef} />
        </div>
      </div>

      {showScrollBottom && (
        <button
          type="button"
          className="scroll-bottom-btn"
          onClick={scrollToBottom}
          aria-label="Scroll to bottom"
          title="Scroll to bottom"
        >
          <ArrowDown size={16} />
        </button>
      )}

      <div className="thread-composer-dock">
        <div className="composer-center">
          <Composer
            docked
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
    </div>
  );
}
