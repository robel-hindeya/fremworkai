"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="page">
      <div className="card" style={{ maxWidth: 560, margin: "48px auto 0" }}>
        <div className="empty">
          <span className="ic-box err"><AlertTriangle size={18} /></span>
          <h3>This page didn’t load.</h3>
          <p>Something went wrong on our side. Your data is safe. Try again, or go back to chat.</p>
          {error.digest && <span className="mono muted" style={{ fontSize: 12 }}>Reference: {error.digest}</span>}
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn primary" onClick={reset}>Try again</button>
            <Link className="btn" href="/chat">Go to chat</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
