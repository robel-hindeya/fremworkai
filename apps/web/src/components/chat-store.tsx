"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { CONVERSATIONS } from "@/lib/data";
import { api } from "@/lib/client/api";

export type Mode = "Fast" | "Balanced" | "Deep Analysis";
export type AnswerKind = "performance" | "expenses" | "forecast" | "risks" | "compare" | "report" | "nodata" | "files";
export type AttachedFile = { name: string; ext: string; size: string };
export type Message =
  | { id: string; role: "user"; text: string; files: AttachedFile[] }
  | {
      id: string;
      role: "ai";
      kind: AnswerKind;
      mode: Mode;
      status: "thinking" | "done" | "error" | "stopped" | "limit";
      fileName?: string;
      text?: string;
      thought?: string;
      toolCalls?: { tool: string; args: any; result: any }[];
      actionsTaken?: string[];
      blocks?: any[];
    };
export type Conversation = { id: string; title: string; projectId?: string; messages: Message[] };

type Ctx = {
  conversations: Conversation[];
  mode: Mode;
  setMode: (m: Mode) => void;
  usage: { used: number; limit: number };
  send: (convoId: string | null, text: string, files: AttachedFile[]) => string;
  stop: (convoId: string, msgId: string) => void;
  retry: (convoId: string, msgId: string) => void;
  addToProject: (convoId: string, projectId: string) => void;
  rename: (convoId: string, title: string) => void;
  remove: (convoId: string) => void;
};

const ChatCtx = createContext<Ctx | null>(null);
const uid = () => Math.random().toString(36).slice(2, 10);

export function classify(text: string): AnswerKind {
  const t = text.toLowerCase();
  if (/march 2025|2019|2020|last decade/.test(t)) return "nodata";
  if (/forecast|runway|projection|predict|how long/.test(t)) return "forecast";
  if (/risk|danger|exposure|worr|overdue|receivable/.test(t)) return "risks";
  if (/compar|last month|versus|vs\.?/.test(t)) return "compare";
  if (/report|p&l|board|statement/.test(t)) return "report";
  if (/expens|spend|cost|software|travel|budget/.test(t)) return "expenses";
  return "performance";
}

const seed: Conversation[] = CONVERSATIONS.map((c) => ({
  id: c.id,
  title: c.title,
  messages: [
    { id: c.id + "-q", role: "user", text: c.q, files: [] },
    { id: c.id + "-a", role: "ai", kind: c.kind as AnswerKind, mode: "Balanced", status: "done" },
  ],
}));

export function ChatProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>(seed);
  const [mode, setMode] = useState<Mode>("Balanced");
  const [usage, setUsage] = useState({ used: 342, limit: 1000 });
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Sync with backend on mount
  useEffect(() => {
    api
      .get<{ id: string; title: string; project_id?: string }[]>("/api/chat")
      .then(async (list) => {
        if (!list || list.length === 0) return;
        const details = await Promise.all(
          list.slice(0, 10).map((c) =>
            api.get<any>(`/api/chat/${c.id}`).catch(() => null)
          )
        );
        const valid = details.filter(Boolean).map((d) => ({
          id: d.id,
          title: d.title,
          projectId: d.project_id,
          messages: d.messages?.map((m: any) => ({
            id: m.id,
            role: m.role,
            kind: m.kind as AnswerKind,
            mode: (m.mode as Mode) || "Balanced",
            status: m.status,
            text: m.text,
            fileName: m.file_name,
            files: m.files || [],
          })) || [],
        }));
        if (valid.length > 0) {
          setConversations(valid);
        }
      })
      .catch(() => {});
  }, []);

  const patchMsg = useCallback((cid: string, mid: string, patch: Partial<Message>) => {
    setConversations((cs) =>
      cs.map((c) => (c.id !== cid ? c : { ...c, messages: c.messages.map((m) => (m.id === mid ? ({ ...m, ...patch } as Message) : m)) }))
    );
  }, []);

  const send = useCallback<Ctx["send"]>(
    (convoId, text, files) => {
      const cid = convoId ?? uid();
      const q = text.trim() || (files.length ? "Analyze the attached file." : "");
      const mid = uid();
      const limitHit = usage.used >= usage.limit || /usage limit/i.test(q);
      const forcedError = /\bfail\b|\berror test\b/i.test(q);

      const ai: Message = {
        id: mid,
        role: "ai",
        kind: files.length ? "files" : classify(q),
        mode,
        status: limitHit ? "limit" : "thinking",
        fileName: files[0]?.name,
      };
      const user: Message = { id: uid(), role: "user", text: q, files };

      setConversations((cs) => {
        const exists = cs.find((c) => c.id === cid);
        if (exists) return cs.map((c) => (c.id === cid ? { ...c, messages: [...c.messages, user, ai] } : c));
        return [{ id: cid, title: q.replace(/[.?!]+$/, "").slice(0, 48) || "New chat", messages: [user, ai] }, ...cs];
      });

      if (!limitHit) {
        setUsage((u) => ({ ...u, used: u.used + 1 }));

        const delay = mode === "Fast" ? 600 : mode === "Balanced" ? 1200 : 2000;
        timers.current[mid] = setTimeout(() => {
          const offline = typeof navigator !== "undefined" && navigator.onLine === false;
          if (offline || forcedError) {
            patchMsg(cid, mid, { status: "error" });
          } else {
            // First attempt live SSE streaming from NestJS API
            const streamedBlocks: any[] = [];
            api
              .stream(
                `/v1/conversations/${cid}/messages`,
                { text: q, mode },
                {
                  onBlock: (blk) => {
                    streamedBlocks.push(blk);
                    patchMsg(cid, mid, { blocks: [...streamedBlocks], status: "thinking" });
                  },
                  onDone: () => {
                    patchMsg(cid, mid, { blocks: [...streamedBlocks], status: "done" });
                  },
                  onError: () => {
                    // Fallback to Next.js route if SSE proxy is unavailable
                    api
                      .post<{ conversation: any; aiMessage: any }>("/api/chat", {
                        conversationId: cid,
                        text: q,
                        files,
                        mode,
                      })
                      .then((res) => {
                        if (res?.aiMessage) {
                          patchMsg(cid, mid, {
                            status: "done",
                            kind: res.aiMessage.kind,
                            text: res.aiMessage.text,
                            thought: res.aiMessage.thought,
                            toolCalls: res.aiMessage.toolCalls,
                            actionsTaken: res.aiMessage.actionsTaken,
                          });
                        } else {
                          patchMsg(cid, mid, { status: "done" });
                        }
                      })
                      .catch(() => {
                        patchMsg(cid, mid, { status: "done" });
                      });
                  },
                }
              )
              .catch(() => {
                patchMsg(cid, mid, { status: "done" });
              });
          }
        }, delay);
      }
      return cid;
    },
    [mode, patchMsg, usage]
  );

  const stop = useCallback(
    (cid: string, mid: string) => {
      clearTimeout(timers.current[mid]);
      patchMsg(cid, mid, { status: "stopped" });
    },
    [patchMsg]
  );

  const retry = useCallback(
    (cid: string, mid: string) => {
      patchMsg(cid, mid, { status: "thinking", mode });
      const delay = mode === "Fast" ? 600 : mode === "Balanced" ? 1200 : 2000;
      timers.current[mid] = setTimeout(() => {
        patchMsg(cid, mid, { status: "done" });
      }, delay);
    },
    [mode, patchMsg]
  );

  const addToProject = useCallback((cid: string, projectId: string) => {
    setConversations((cs) => cs.map((c) => (c.id === cid ? { ...c, projectId } : c)));
  }, []);

  const rename = useCallback((cid: string, title: string) => {
    setConversations((cs) => cs.map((c) => (c.id === cid ? { ...c, title } : c)));
    api.put(`/api/chat/${cid}`, { title }).catch(() => {});
  }, []);

  const remove = useCallback((cid: string) => {
    setConversations((cs) => cs.filter((c) => c.id !== cid));
    api.delete(`/api/chat/${cid}`).catch(() => {});
  }, []);

  return (
    <ChatCtx.Provider value={{ conversations, mode, setMode, usage, send, stop, retry, addToProject, rename, remove }}>
      {children}
    </ChatCtx.Provider>
  );
}

export function useChat() {
  const c = useContext(ChatCtx);
  if (!c) throw new Error("useChat must be used inside ChatProvider");
  return c;
}
