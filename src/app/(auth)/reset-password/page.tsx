"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useState } from "react";
import { PasswordField, passwordRule } from "@/components/auth-bits";
import { Banner } from "@/components/ui";

export default function Reset() {
  const [pw, setPw] = useState("");
  const [again, setAgain] = useState("");
  const [tried, setTried] = useState(false);
  const [done, setDone] = useState(false);
  const e = { pw: passwordRule(pw), again: !again ? "Type the password again." : again !== pw ? "The passwords don’t match." : "" };

  if (done) {
    return (
      <div className="auth-form">
        <span className="ic-box ok" style={{ width: 48, height: 48, borderRadius: "50%" }}><Check size={22} /></span>
        <div><h1>Password updated</h1><p className="muted" style={{ margin: "6px 0 0" }}>You can sign in with your new password now. We signed you out on your other devices.</p></div>
        <Link href="/sign-in" className="btn primary lg block">Sign in</Link>
      </div>
    );
  }
  return (
    <form className="auth-form" noValidate onSubmit={(x) => { x.preventDefault(); if (e.pw || e.again) return setTried(true); setDone(true); }}>
      <div><h1>Choose a new password</h1><p className="muted" style={{ margin: "6px 0 0" }}>You’ll use it the next time you sign in.</p></div>
      {tried && (e.pw || e.again) && <Banner tone="err">Fix the highlighted fields to continue.</Banner>}
      <PasswordField id="rp-pw" label="New password" value={pw} onChange={setPw} error={tried ? e.pw || undefined : undefined} hint="At least 8 characters, with a letter and a number." autoComplete="new-password" />
      <PasswordField id="rp-again" label="Confirm new password" value={again} onChange={setAgain} error={tried ? e.again || undefined : undefined} autoComplete="new-password" />
      <button type="submit" className="btn primary lg block">Update password</button>
      <p className="muted" style={{ margin: 0, textAlign: "center" }}>Link expired? <Link href="/forgot-password" style={{ fontWeight: 500, textDecoration: "none" }}>Request a new one</Link></p>
    </form>
  );
}
