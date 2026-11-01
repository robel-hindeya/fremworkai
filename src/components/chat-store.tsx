"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { CONVERSATIONS } from "@/lib/data";

export type Mode = "Fast" | "Balanced" | "Deep Analysis";
export type AnswerKind = "performance" | "expenses" | "forecast" | "risks" | "compare" | "report" | "nodata" | "files";
export type AttachedFile = { name: string; ext: string; size: string };
export type Message =
  | { id: string; role: "user"; text: string; files: AttachedFile[] }
  | { id: string; role: "ai"; kind: AnswerKind; mode: Mode; status: "thinking" | "done" | "error" | "stopped" | "limit"; fileName?: string };
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

  const patchMsg = useCallback((cid: string, mid: string, patch: Partial<Message>) => {
    setConversations((cs) => cs.map((c) => (c.id !== cid ? c : { ...c, messages: c.messages.map((m) => (m.id === mid ? ({ ...m, ...patch } as Message) : m)) })));
  }, []);

  const resolve = useCallback(
    (cid: string, mid: string, text: string, m: Mode) => {
      const delay = m === "Fast" ? 700 : m === "Balanced" ? 1400 : 2400;
      timers.current[mid] = setTimeout(() => {
        const offline = typeof navigator !== "undefined" && navigator.onLine === false;
        const forcedError = /\bfail\b|\berror test\b/i.test(text);
        patchMsg(cid, mid, { status: offline || forcedError ? "error" : "done" });
      }, delay);
    },
    [patchMsg]
  );

  const send = useCallback<Ctx["send"]>(
    (convoId, text, files) => {
      const cid = convoId ?? uid();
      const q = text.trim() || (files.length ? "Analyze the attached file." : "");
      const mid = uid();
      const limitHit = usage.used >= usage.limit || /usage limit/i.test(q);
      const ai: Message = { id: mid, role: "ai", kind: files.length ? "files" : classify(q), mode, status: limitHit ? "limit" : "thinking", fileName: files[0]?.name };
      const user: Message = { id: uid(), role: "user", text: q, files };
      setConversations((cs) => {
        const exists = cs.find((c) => c.id === cid);
        if (exists) return cs.map((c) => (c.id === cid ? { ...c, messages: [...c.messages, user, ai] } : c));
        return [{ id: cid, title: q.replace(/[.?!]+$/, "").slice(0, 48) || "New chat", messages: [user, ai] }, ...cs];
      });
      if (!limitHit) {
        setUsage((u) => ({ ...u, used: u.used + 1 }));
        resolve(cid, mid, q, mode);
      }
      return cid;
    },
    [mode, resolve, usage]
  );

  const stop = useCallback((cid: string, mid: string) => {
    clearTimeout(timers.current[mid]);
    patchMsg(cid, mid, { status: "stopped" });
  }, [patchMsg]);

  const retry = useCallback(
    (cid: string, mid: string) => {
      patchMsg(cid, mid, { status: "thinking", mode });
      resolve(cid, mid, "", mode);
    },
    [mode, patchMsg, resolve]
  );

  const addToProject = useCallback((cid: string, projectId: string) => setConversations((cs) => cs.map((c) => (c.id === cid ? { ...c, projectId } : c))), []);
  const rename = useCallback((cid: string, title: string) => setConversations((cs) => cs.map((c) => (c.id === cid ? { ...c, title } : c))), []);
  const remove = useCallback((cid: string) => setConversations((cs) => cs.filter((c) => c.id !== cid)), []);

  return <ChatCtx.Provider value={{ conversations, mode, setMode, usage, send, stop, retry, addToProject, rename, remove }}>{children}</ChatCtx.Provider>;
}

export function useChat() {
  const c = useContext(ChatCtx);
  if (!c) throw new Error("useChat must be used inside ChatProvider");
  return c;
}
