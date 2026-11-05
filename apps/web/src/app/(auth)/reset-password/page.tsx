"use client";

import Link from "next/link";
import { useState } from "react";
import { PasswordField, passwordRule } from "@/components/auth-bits";
import { Banner } from "@/components/ui";
import { api } from "@/lib/client/api";

export default function ResetPassword() {
  const [pw, setPw] = useState("");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [apiError, setApiError] = useState("");
  const err = passwordRule(pw);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (err) return setTried(true);
    setBusy(true);
    setApiError("");
    try {
      await api.post("/api/auth/password", { password: pw });
      window.location.replace("/chat");
    } catch (x: any) {
      setApiError(x.message);
      setBusy(false);
    }
  };

  return (
    <form className="auth-form" noValidate onSubmit={submit}>
      <div><h1>Choose a new password</h1><p className="muted" style={{ margin: "6px 0 0" }}>You’ll stay signed in on this device.</p></div>
      {apiError && <Banner tone="err">{apiError} <Link href="/forgot-password">Send a new link</Link></Banner>}
      <PasswordField id="rp-pw" label="New password" value={pw} onChange={setPw} error={tried ? err || undefined : undefined} hint="At least 8 characters, with a letter and a number." autoComplete="new-password" />
      <button type="submit" className="btn primary lg block" disabled={busy}>{busy ? "Saving…" : "Save new password"}</button>
    </form>
  );
}
