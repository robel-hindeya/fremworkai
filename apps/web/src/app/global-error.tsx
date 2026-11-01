"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#FAFAF8", color: "#0A0A0A" }}>
        <main style={{ textAlign: "center", padding: 24, maxWidth: 440 }}>
          <h1 style={{ fontSize: 28, margin: "0 0 8px" }}>Fremwork couldn’t load.</h1>
          <p style={{ color: "#5E5E5E", margin: "0 0 20px" }}>Something went wrong on our side. Your data is safe. Try again, and if it keeps happening, email support@fremwork.com.</p>
          <button onClick={reset} style={{ height: 40, padding: "0 18px", borderRadius: 999, border: 0, background: "#0A0A0A", color: "#fff", cursor: "pointer" }}>Try again</button>
        </main>
      </body>
    </html>
  );
}
