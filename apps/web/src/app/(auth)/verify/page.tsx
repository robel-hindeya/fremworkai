"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { DemoNote } from "@/components/auth-bits";
import { Banner, Field } from "@/components/ui";

function Verify() {
  const router = useRouter();
  const email = useSearchParams().get("email") || "your email";
  const [code, setCode] = useState("");
  const [tried, setTried] = useState(false);
  const [wrong, setWrong] = useState(0);
  const [cool, setCool] = useState(0);
  const [resent, setResent] = useState(false);
  useEffect(() => { if (cool <= 0) return; const t = setTimeout(() => setCool(cool - 1), 1000); return () => clearTimeout(t); }, [cool]);
  const err = !/^\d{6}$/.test(code) ? "Enter the 6-digit code from the email." : "";
  const expired = wrong >= 5;

  return (
    <form className="auth-form" noValidate onSubmit={(e) => { e.preventDefault(); if (err) return setTried(true); if (code !== "482913") { setWrong(wrong + 1); return; } router.push("/onboarding"); }}>
      <span className="ic-box" style={{ width: 48, height: 48, borderRadius: "50%" }}><Mail size={22} /></span>
      <div><h1>Check your email</h1><p className="muted" style={{ margin: "6px 0 0" }}>We sent a 6-digit code to <b style={{ color: "var(--ink)" }}>{email}</b>. It expires in 10 minutes.</p></div>
      {expired ? <Banner tone="err" title="Too many wrong codes.">This code no longer works. Send a new one to continue.</Banner>
        : wrong > 0 ? <Banner tone="err" title="That code doesn’t match.">Check the latest email from Fremwork, or send a new code.</Banner>
        : resent ? <Banner tone="ok" title="New code sent.">It can take a minute to arrive. Check spam if you don’t see it.</Banner> : null}
      <Field id="v-code" label="Verification code" error={tried ? err || undefined : undefined}>
        {(a) => <input {...a} className="input lg mono" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000" value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setTried(false); }} style={{ letterSpacing: "0.3em", fontSize: 18 }} />}
      </Field>
      <button type="submit" className="btn primary lg block" disabled={expired}>Verify email</button>
      <button type="button" className="btn lg block" disabled={cool > 0} onClick={() => { setResent(true); setWrong(0); setCode(""); setCool(30); }}>{cool > 0 ? `Send a new code in ${cool}s` : "Send a new code"}</button>
      <p className="muted" style={{ margin: 0, textAlign: "center" }}>Wrong email? <Link href="/sign-up" style={{ fontWeight: 500, textDecoration: "none" }}>Go back</Link></p>
      <DemoNote>Demo code: 482913</DemoNote>
    </form>
  );
}

export default function VerifyPage() {
  return <Suspense><Verify /></Suspense>;
}
