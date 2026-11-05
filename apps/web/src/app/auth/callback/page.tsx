"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/client/api";

/** Email links land here with the session in the URL hash, which only the browser can read. */
export default function AuthCallback() {
  const [error, setError] = useState("");

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const access_token = hash.get("access_token");
    if (!access_token) {
      setError(hash.get("error_description")?.replace(/\+/g, " ") || "This link is invalid or has expired.");
      return;
    }
    api
      .post("/api/auth/session", { access_token, refresh_token: hash.get("refresh_token"), expires_in: hash.get("expires_in") })
      .then(() => window.location.replace(hash.get("type") === "recovery" ? "/reset-password" : "/chat"))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 16, textAlign: "center" }}>
      {error ? <div><p>{error}</p><Link href="/sign-in" className="btn primary">Back to sign in</Link></div> : <p className="muted">Signing you in…</p>}
    </div>
  );
}
