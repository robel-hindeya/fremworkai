"use client";

import { Check, X, AlertTriangle } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";

/** Modal shell: focus trap-lite, Escape to close, click outside to close. */
export function Modal({ title, sub, onClose, children, footer }: { title: string; sub?: string; onClose: () => void; children?: ReactNode; footer?: ReactNode }) {
  const tid = useId();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const first = ref.current?.querySelector<HTMLElement>("input, select, textarea, button:not([aria-label='Close'])");
    (first ?? ref.current)?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className="dialog" role="dialog" aria-modal="true" aria-labelledby={tid} tabIndex={-1}>
        <div className="dialog-head">
          <div>
            <h2 id={tid}>{title}</h2>
            {sub && <p>{sub}</p>}
          </div>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        {children}
        {footer && <div className="dialog-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function ResultView({ tone, title, children, onClose, extra }: { tone: "ok" | "err"; title: string; children?: ReactNode; onClose: () => void; extra?: ReactNode }) {
  return (
    <>
      <div className="result" role={tone === "err" ? "alert" : "status"}>
        <span className={`circle ${tone}`}>{tone === "ok" ? <Check size={20} strokeWidth={2.4} /> : <AlertTriangle size={20} strokeWidth={2} />}</span>
        <div style={{ minWidth: 0 }}>
          <b>{title}</b>
          {children && <p>{children}</p>}
        </div>
      </div>
      <div className="dialog-foot">
        {extra}
        <button type="button" className="btn primary" onClick={onClose}>
          Done
        </button>
      </div>
    </>
  );
}

export function WorkingView({ label }: { label: string }) {
  return (
    <div role="status" style={{ padding: "28px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
      <b style={{ fontWeight: 500 }}>{label}</b>
      <div className="progress">
        <i className="skeleton" style={{ width: "62%", background: "var(--ink)" }} />
      </div>
      <span className="muted" style={{ fontSize: 12.5 }}>
        This usually takes a few seconds.
      </span>
    </div>
  );
}
