"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import { useState } from "react";
import { Banner, Field } from "@/components/ui";
import { isEmail } from "@/lib/format";

export default function Forgot() {
  const [email, setEmail] = useState("");
  const [tried, setTried] = useState(false);
  const [sent, setSent] = useState(false);
  const [again, setAgain] = useState(false);
  const err = !email.trim() ? "Enter your work email." : !isEmail(email) ? "Enter a valid email, like name@company.com." : "";

  if (sent) {
    return (
      <div className="auth-form">
        <span className="ic-box" style={{ width: 48, height: 48, borderRadius: "50%" }}><Mail size={22} /></span>
        <div><h1>Check your inbox</h1><p className="muted" style={{ margin: "6px 0 0" }}>If an account exists for <b style={{ color: "var(--ink)" }}>{email.trim()}</b>, we sent a link to reset your password. It expires in 30 minutes.</p></div>
        {again && <Banner tone="ok" title="Sent again.">The newest link replaces the earlier one.</Banner>}
        <Link href="/reset-password" className="btn primary lg block">Open reset link (demo)</Link>
        <button className="btn lg block" onClick={() => setAgain(true)}>Resend email</button>
        <p className="muted" style={{ margin: 0, textAlign: "center" }}>Didn’t get it? Check spam, or <button className="link-btn" style={{ fontSize: 14 }} onClick={() => { setSent(false); setAgain(false); }}>try another email</button>.</p>
      </div>
    );
  }
  return (
    <form className="auth-form" noValidate onSubmit={(e) => { e.preventDefault(); if (err) return setTried(true); setSent(true); }}>
      <div><h1>Reset your password</h1><p className="muted" style={{ margin: "6px 0 0" }}>Enter the email you use for Fremwork and we’ll send you a reset link.</p></div>
      <Field id="fp-email" label="Work email" error={tried ? err || undefined : undefined}>{(a) => <input {...a} type="email" className="input lg" autoComplete="email" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />}</Field>
      <button type="submit" className="btn primary lg block">Send reset link</button>
      <p className="muted" style={{ margin: 0, textAlign: "center" }}>Remembered it? <Link href="/sign-in" style={{ fontWeight: 500, textDecoration: "none" }}>Back to sign in</Link></p>
    </form>
  );
}
