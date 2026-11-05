"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import { useState } from "react";
import { Banner, Field } from "@/components/ui";
import { api } from "@/lib/client/api";
import { isEmail } from "@/lib/format";

export default function Forgot() {
  const [email, setEmail] = useState("");
  const [tried, setTried] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [apiError, setApiError] = useState("");
  const err = !email.trim() ? "Enter your email." : !isEmail(email) ? "Enter a valid email, like name@company.com." : "";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (err) return setTried(true);
    setBusy(true);
    setApiError("");
    try {
      await api.post("/api/auth/forgot", { email });
      setSent(true);
    } catch (x: any) {
      setApiError(x.message);
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="auth-form">
        <span className="ic-box" style={{ width: 48, height: 48, borderRadius: "50%" }}><Mail size={22} /></span>
        <div><h1>Check your inbox</h1><p className="muted" style={{ margin: "6px 0 0" }}>If an account exists for <b style={{ color: "var(--ink)" }}>{email.trim()}</b>, we sent a link to reset your password.</p></div>
        <p className="muted" style={{ margin: 0, textAlign: "center" }}><Link href="/sign-in" style={{ fontWeight: 500, textDecoration: "none" }}>Back to sign in</Link></p>
      </div>
    );
  }
  return (
    <form className="auth-form" noValidate onSubmit={submit}>
      <div><h1>Reset your password</h1><p className="muted" style={{ margin: "6px 0 0" }}>Enter your email and we’ll send you a reset link.</p></div>
      {apiError && <Banner tone="err">{apiError}</Banner>}
      <Field id="fp-email" label="Email" error={tried ? err || undefined : undefined}>{(a) => <input {...a} type="email" className="input lg" autoComplete="email" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />}</Field>
      <button type="submit" className="btn primary lg block" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</button>
      <p className="muted" style={{ margin: 0, textAlign: "center" }}>Remembered it? <Link href="/sign-in" style={{ fontWeight: 500, textDecoration: "none" }}>Back to sign in</Link></p>
    </form>
  );
}
