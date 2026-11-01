"use client";

import { useState } from "react";
import { Field } from "@/components/ui";

export function PasswordField({ id, label, value, onChange, error, hint, autoComplete, aside }: { id: string; label: string; value: string; onChange: (v: string) => void; error?: string; hint?: string; autoComplete: string; aside?: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      {aside && <div style={{ position: "absolute", right: 0, top: 0 }}>{aside}</div>}
      <Field id={id} label={label} error={error} hint={hint}>
        {(a) => (
          <div className="pw-wrap">
            <input {...a} type={show ? "text" : "password"} className="input lg" value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} />
            <button type="button" className="pw-toggle" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)}>{show ? "Hide" : "Show"}</button>
          </div>
        )}
      </Field>
    </div>
  );
}

export function GoogleButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="btn lg block" onClick={onClick}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden><path d="M12 3a9 9 0 1 0 8.5 12H12v-4h9" /></svg>
      Continue with Google
    </button>
  );
}

export function DemoNote({ children }: { children: React.ReactNode }) {
  return <p className="demo-pill" style={{ margin: 0, alignSelf: "center", textAlign: "center", whiteSpace: "normal" }}>{children}</p>;
}

export const passwordRule = (pw: string) => (!pw ? "Create a password." : pw.length < 8 ? "Use at least 8 characters." : !/\d/.test(pw) || !/[a-z]/i.test(pw) ? "Include at least one letter and one number." : "");
