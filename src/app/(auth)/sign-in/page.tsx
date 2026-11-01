"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DemoNote, GoogleButton, PasswordField } from "@/components/auth-bits";
import { Banner, Field } from "@/components/ui";
import { isEmail } from "@/lib/format";

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [tried, setTried] = useState(false);
  const [fails, setFails] = useState(0);
  const [wrong, setWrong] = useState(false);
  const [sso, setSso] = useState(false);
  const [busy, setBusy] = useState(false);
  const locked = fails >= 3;
  const e = { email: !email.trim() ? "Enter your work email." : !isEmail(email) ? "Enter a valid email, like name@company.com." : "", pw: !pw ? "Enter your password." : "" };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (locked) return;
    if (e.email || e.pw) return setTried(true);
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      if (pw !== "demo1234") { setFails(fails + 1); setWrong(true); setTried(false); return; }
      router.push("/chat");
    }, 700);
  };

  return (
    <form className="auth-form" onSubmit={submit} noValidate>
      <div><h1>Welcome back</h1><p className="muted" style={{ margin: "6px 0 0" }}>Sign in to Fremwork.</p></div>
      {locked ? <Banner tone="err" title="Too many attempts.">For your security, sign-in is paused for 15 minutes. <Link href="/forgot-password">Reset your password</Link> to get back in now.</Banner>
        : wrong ? <Banner tone="err" title="That email and password don’t match.">Try again, or reset your password. {3 - fails} {3 - fails === 1 ? "try" : "tries"} left before sign-in pauses.</Banner>
        : sso ? <Banner tone="warn" title="Google sign-in was cancelled.">Try again, or sign in with your email.</Banner> : null}
      {!locked && <><GoogleButton onClick={() => setSso(true)} /><div className="divider">or with email</div></>}
      <Field id="si-email" label="Work email" error={tried ? e.email || undefined : undefined}>{(a) => <input {...a} type="email" className="input lg" autoComplete="email" placeholder="name@company.com" value={email} onChange={(x) => { setEmail(x.target.value); setWrong(false); }} />}</Field>
      <PasswordField id="si-pw" label="Password" value={pw} onChange={(v) => { setPw(v); setWrong(false); }} error={tried ? e.pw || undefined : undefined} autoComplete="current-password" aside={<Link href="/forgot-password" style={{ fontSize: 13, fontWeight: 500, textDecoration: "none" }}>Forgot password?</Link>} />
      <button type="submit" className="btn primary lg block" disabled={locked || busy}>{locked ? "Sign-in paused" : busy ? "Signing in…" : "Sign in"}</button>
      <p className="muted" style={{ margin: 0, textAlign: "center" }}>New to Fremwork? <Link href="/sign-up" style={{ fontWeight: 500, textDecoration: "none" }}>Create an account</Link></p>
      <DemoNote>Demo password: demo1234 · 3 wrong tries pauses sign-in</DemoNote>
    </form>
  );
}
