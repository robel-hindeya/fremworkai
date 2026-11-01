import { Logo } from "@/components/ui";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth">
      <div className="auth-main">
        <Logo height={24} />
        <div className="auth-center">{children}</div>
        <p className="muted" style={{ margin: 0, fontSize: 12 }}>© 2026 Fremwork · Privacy · Terms</p>
      </div>
      <aside className="auth-aside" aria-hidden>
        <span className="overline" style={{ color: "#8C8C8C" }}>Financial intelligence, in plain language</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <p style={{ margin: 0, fontSize: 44, lineHeight: 1.05, letterSpacing: "-0.035em", fontWeight: 600 }}>One chat.<br />A whole finance team.</p>
          <div style={{ background: "#1A1A1A", border: "1px solid #2B2B2B", borderRadius: 16, padding: 18, display: "flex", flexDirection: "column", gap: 12, maxWidth: 440 }}>
            <div style={{ alignSelf: "flex-end", background: "#2B2B2B", borderRadius: 14, padding: "8px 12px", fontSize: 13.5 }}>How long will our cash last?</div>
            <div style={{ fontSize: 13.5, color: "#EDEDED", lineHeight: 1.55 }}>At October’s spend, cash covers <b style={{ color: "#fff" }}>2.3 months</b>. Collecting the three overdue invoices adds about two more weeks.</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12, color: "#8C8C8C" }}><span style={{ width: 8, height: 8, background: "#C6F432" }} />Recommendation ready</div>
          </div>
        </div>
        <span style={{ fontSize: 12.5, color: "#8C8C8C" }}>Bank-grade encryption. Your data is never used to train shared models.</span>
      </aside>
    </div>
  );
}
