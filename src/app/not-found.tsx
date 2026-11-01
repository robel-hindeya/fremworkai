import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <main style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24, textAlign: "center" }}>
      <Image src="/brand/fremwork-icon.svg" alt="" width={48} height={48} />
      <span className="overline">Error 404</span>
      <h1 style={{ margin: 0, fontSize: 32, letterSpacing: "-0.02em" }}>We can’t find that page.</h1>
      <p className="muted" style={{ margin: 0, maxWidth: "44ch" }}>The link may be old, or the page was moved. Check the address, or head back to your workspace.</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        <Link href="/chat" className="btn primary">Go to Fremwork</Link>
        <Link href="/help" className="btn">Get help</Link>
      </div>
    </main>
  );
}
