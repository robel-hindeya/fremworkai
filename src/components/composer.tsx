"use client";

import { ArrowUp, Check, ChevronDown, FileSpreadsheet, FileText, Image as ImageIcon, Mic, Paperclip, Scale, Search, Square, X, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useChat, type AttachedFile, type Mode } from "@/components/chat-store";
import { useToast } from "@/components/toast";
import { Banner } from "@/components/ui";
import { checkFiles } from "@/lib/format";

const MODES: { m: Mode; icon: typeof Zap }[] = [
  { m: "Fast", icon: Zap },
  { m: "Balanced", icon: Scale },
  { m: "Deep Analysis", icon: Search },
];
const KINDS = [
  { t: "Document", f: "PDF", accept: ".pdf", icon: FileText },
  { t: "Spreadsheet", f: "XLSX · CSV", accept: ".xlsx,.xls,.csv", icon: FileSpreadsheet },
  { t: "Image", f: "PNG · JPG", accept: "image/png,image/jpeg,image/webp", icon: ImageIcon },
  { t: "Any file", f: "ALL", accept: "", icon: Paperclip },
];

type Props = { onSend: (text: string, files: AttachedFile[]) => void; docked?: boolean; busy?: boolean; onStop?: () => void; autoFocus?: boolean };

export function Composer({ onSend, docked, busy, onStop, autoFocus }: Props) {
  const { mode, setMode } = useChat();
  const toast = useToast();
  const [text, setText] = useState("");
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [menu, setMenu] = useState<"attach" | "mode" | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => wrapRef.current && !wrapRef.current.contains(e.target as Node) && setMenu(null);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMenu(null);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, []);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(220, ta.scrollHeight) + "px";
  }, [text]);

  const canSend = !busy && (text.trim().length > 0 || files.length > 0);
  const submit = () => {
    if (!canSend) return;
    if (text.length > 8000) {
      setErrors(["Your message is over 8,000 characters. Shorten it, or attach the text as a file."]);
      return;
    }
    onSend(text, files);
    setText("");
    setFiles([]);
    setErrors([]);
  };

  const pick = (accept: string) => {
    setMenu(null);
    if (!fileRef.current) return;
    fileRef.current.accept = accept;
    fileRef.current.click();
  };

  const voice = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("unsupported");
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      s.getTracks().forEach((t) => t.stop());
      toast("Listening isn’t connected yet. Voice input arrives with the backend.");
    } catch {
      toast("Microphone access is blocked. Allow it in your browser settings to use voice.", "err");
    }
  };

  const ModeIcon = MODES.find((x) => x.m === mode)!.icon;

  return (
    <div ref={wrapRef}>
      <form className="composer" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        {errors.length > 0 && (
          <Banner tone="err" action={<button type="button" className="icon-btn" style={{ width: 24, height: 24 }} aria-label="Dismiss" onClick={() => setErrors([])}><X size={14} /></button>}>
            {errors.map((e) => <div key={e}>{e}</div>)}
          </Banner>
        )}
        {files.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {files.map((f, i) => (
              <span key={f.name + i} className="file-chip">
                <span className="tag solid">{f.ext}</span>
                <span className="name">{f.name}</span>
                <span className="muted">{f.size}</span>
                <button type="button" className="icon-btn" style={{ width: 24, height: 24 }} aria-label={`Remove ${f.name}`} onClick={() => setFiles(files.filter((_, j) => j !== i))}><X size={14} /></button>
              </span>
            ))}
          </div>
        )}
        <label htmlFor="composer-input" className="sr-only">Message Fremwork</label>
        <textarea
          id="composer-input"
          ref={taRef}
          rows={docked ? 1 : 2}
          autoFocus={autoFocus}
          placeholder={docked ? "Reply to Fremwork…" : "Ask about revenue, cash flow, budgets, or upload a statement…"}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit(); } }}
          style={docked ? { minHeight: 28 } : undefined}
        />
        <input ref={fileRef} type="file" multiple hidden onChange={(e) => {
          const r = checkFiles(Array.from(e.target.files ?? []), files.length);
          setFiles((f) => [...f, ...r.ok]);
          setErrors(r.errors);
          e.target.value = "";
        }} />
        <div className="composer-bar">
          <div style={{ position: "relative" }}>
            <button type="button" className="icon-btn outlined" aria-label="Attach files" aria-haspopup="menu" aria-expanded={menu === "attach"} onClick={() => setMenu(menu === "attach" ? null : "attach")}><Paperclip size={18} /></button>
            {menu === "attach" && (
              <div className="menu" role="menu" style={{ [docked ? "bottom" : "top"]: "calc(100% + 8px)", left: 0, width: 240 }}>
                <div className="overline" style={{ padding: "6px 10px" }}>Attach</div>
                {KINDS.map((k) => (
                  <button key={k.t} type="button" role="menuitem" className="menu-item" onClick={() => pick(k.accept)}>
                    <span className="ic-box"><k.icon size={16} /></span>
                    <span style={{ flex: 1 }}>{k.t}</span>
                    <span className="mono muted" style={{ fontSize: 10.5 }}>{k.f}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className="spacer" />
          <div style={{ position: "relative" }}>
            <button type="button" className="mode-btn" aria-haspopup="menu" aria-expanded={menu === "mode"} aria-label={`Reasoning mode: ${mode}`} onClick={() => setMenu(menu === "mode" ? null : "mode")}>
              <ModeIcon size={14} aria-hidden />{mode}<ChevronDown size={14} style={{ transform: menu === "mode" ? "rotate(180deg)" : undefined }} />
            </button>
            {menu === "mode" && (
              <div className="menu" role="menu" style={{ [docked ? "bottom" : "top"]: "calc(100% + 8px)", right: 0, width: 220 }}>
                <div className="overline" style={{ padding: "6px 10px" }}>Reasoning</div>
                {MODES.map(({ m, icon: I }) => (
                  <button key={m} type="button" role="menuitemradio" aria-checked={mode === m} className="menu-item" onClick={() => { setMode(m); setMenu(null); }}>
                    <span className="ic-box"><I size={16} /></span>
                    <span style={{ flex: 1 }}>{m}</span>
                    {mode === m && <Check size={16} color="var(--blue)" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button type="button" className="icon-btn" aria-label="Voice input" onClick={voice}><Mic size={18} /></button>
          {busy && onStop ? (
            <button type="button" className="send" aria-label="Stop generating" onClick={onStop}><Square size={14} fill="currentColor" /></button>
          ) : (
            <button type="submit" className="send" aria-label="Send" disabled={!canSend}><ArrowUp size={18} /></button>
          )}
        </div>
      </form>
    </div>
  );
}
