"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Bell, Building2, Coins, Cpu, CreditCard, Shield, User } from "lucide-react";
import { Suspense, useState } from "react";
import { Modal, ResultView } from "@/components/dialog";
import { ConfirmDialog } from "@/components/forms";
import { useToast } from "@/components/toast";
import { Banner, Field, Progress, Switch } from "@/components/ui";
import { isEmail } from "@/lib/format";

const TABS = [
  { k: "profile", l: "Profile", icon: User },
  { k: "company", l: "Company", icon: Building2 },
  { k: "finance", l: "Financial preferences", icon: Coins },
  { k: "ai", l: "AI model", icon: Cpu },
  { k: "notifications", l: "Notifications", icon: Bell },
  { k: "security", l: "Security", icon: Shield },
  { k: "billing", l: "Subscription & billing", icon: CreditCard },
] as const;
type TabKey = (typeof TABS)[number]["k"];

function Row({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "center", padding: "14px 0", borderTop: "1px solid var(--mist)", flexWrap: "wrap" }}>
      <div style={{ minWidth: 0, flex: 1 }}><b style={{ display: "block", fontWeight: 500 }}>{title}</b><small className="muted" style={{ fontSize: 12.5 }}>{sub}</small></div>
      {children}
    </div>
  );
}

/** A form section with dirty tracking, validation on save and a saved state. */
function useForm<T extends Record<string, string>>(initial: T, validate: (v: T) => Partial<Record<keyof T, string>>) {
  const [saved, setSaved] = useState(initial);
  const [v, setV] = useState(initial);
  const [tried, setTried] = useState(false);
  const errs = validate(v);
  const bad = Object.values(errs).filter(Boolean).length;
  const dirty = JSON.stringify(v) !== JSON.stringify(saved);
  return {
    v, dirty, bad, tried,
    err: (k: keyof T) => (tried ? errs[k] : undefined),
    set: (k: keyof T) => (e: { target: { value: string } }) => setV((s) => ({ ...s, [k]: e.target.value })),
    save: () => { if (bad) { setTried(true); return false; } setSaved(v); setTried(false); return true; },
    reset: () => { setV(saved); setTried(false); },
  };
}

type FormState = { dirty: boolean; bad: number; tried: boolean; save: () => boolean; reset: () => void };

function SaveBar({ f, toast }: { f: FormState; toast: (t: string, tone?: "ok" | "err") => void }) {
  return (
    <>
      {f.tried && f.bad > 0 && <Banner tone="err">{f.bad === 1 ? "Fix 1 field to save." : `Fix ${f.bad} fields to save.`}</Banner>}
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, borderTop: "1px solid var(--line)", paddingTop: 16, flexWrap: "wrap" }}>
        {f.dirty && <span className="muted" style={{ fontSize: 13, marginRight: "auto" }}>You have unsaved changes.</span>}
        <button className="btn" disabled={!f.dirty} onClick={f.reset}>Discard</button>
        <button className="btn primary" disabled={!f.dirty} onClick={() => { if (f.save()) toast("Settings saved"); }}>Save changes</button>
      </div>
    </>
  );
}

function PasswordDialog({ onClose }: { onClose: () => void }) {
  const [v, setV] = useState({ cur: "", next: "", again: "" });
  const [tried, setTried] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [done, setDone] = useState(false);
  const e = {
    cur: !v.cur ? "Enter your current password." : wrong ? "That isn’t your current password." : "",
    next: !v.next ? "Create a new password." : v.next.length < 8 ? "Use at least 8 characters." : !/\d/.test(v.next) || !/[a-z]/i.test(v.next) ? "Include at least one letter and one number." : v.next === v.cur ? "Pick a password you haven’t used here before." : "",
    again: v.again !== v.next ? "The passwords don’t match." : "",
  };
  const bad = Object.values(e).filter(Boolean).length;
  if (done) return <Modal title="Change password" onClose={onClose}><ResultView tone="ok" title="Password changed." onClose={onClose}>We signed you out on your other devices.</ResultView></Modal>;
  const set = (k: keyof typeof v) => (x: { target: { value: string } }) => { setV({ ...v, [k]: x.target.value }); if (k === "cur") setWrong(false); };
  return (
    <Modal title="Change password" sub="You’ll stay signed in on this device." onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" onClick={() => { if (bad) return setTried(true); if (v.cur !== "demo1234") { setWrong(true); setTried(true); return; } setDone(true); }}>Change password</button></>}>
      <div className="dialog-body">
        {tried && bad > 0 && <Banner tone="err">Fix the highlighted fields.</Banner>}
        <Field id="pw-cur" label="Current password" error={tried ? e.cur : undefined} hint="Demo: demo1234">{(a) => <input {...a} type="password" className="input" value={v.cur} onChange={set("cur")} autoComplete="current-password" />}</Field>
        <Field id="pw-new" label="New password" error={tried ? e.next : undefined} hint="At least 8 characters, with a letter and a number.">{(a) => <input {...a} type="password" className="input" value={v.next} onChange={set("next")} autoComplete="new-password" />}</Field>
        <Field id="pw-again" label="Confirm new password" error={tried ? e.again : undefined}>{(a) => <input {...a} type="password" className="input" value={v.again} onChange={set("again")} autoComplete="new-password" />}</Field>
      </div>
    </Modal>
  );
}

function DeleteWorkspace({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState("");
  const [tried, setTried] = useState(false);
  const router = useRouter();
  const ok = text === "Harbor & Pine Co.";
  return (
    <Modal title="Delete workspace?" sub="Harbor & Pine Co." onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn danger" onClick={() => (ok ? router.push("/sign-up") : setTried(true))}>Delete workspace</button></>}>
      <div className="dialog-body">
        <Banner tone="err" title="This can’t be undone.">All chats, reports, budgets, goals and connections are deleted for everyone in the workspace after 30 days.</Banner>
        <Field id="del-confirm" label="Type the company name to confirm" error={tried && !ok ? "That doesn’t match. Type Harbor & Pine Co. exactly." : undefined}>
          {(a) => <input {...a} className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Harbor & Pine Co." />}
        </Field>
      </div>
    </Modal>
  );
}

function SettingsInner() {
  const params = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const tab = (TABS.find((t) => t.k === params.get("tab"))?.k ?? "profile") as TabKey;
  const go = (k: TabKey) => router.replace(`/settings?tab=${k}`, { scroll: false });

  const profile = useForm({ name: "Selam", email: "selam@harborpine.co", role: "Founder & CEO", tz: "America/Los_Angeles" }, (v) => ({
    name: !v.name.trim() ? "Enter your name." : "",
    email: !v.email.trim() ? "Enter your email." : !isEmail(v.email) ? "Enter a valid email, like name@company.com." : "",
  }));
  const company = useForm({ name: "Harbor & Pine Co.", industry: "Software & SaaS", country: "Ethiopia", tin: "", address: "Bole Office Park, Floor 4, Addis Ababa" }, (v) => ({
    name: !v.name.trim() ? "Enter your company’s legal name." : "",
    tin: v.tin && !/^\d{10}$/.test(v.tin.replace(/\s/g, "")) ? "An Ethiopian TIN has 10 digits." : "",
  }));
  const finance = useForm({ currency: "USD — US dollar", fy: "January", basis: "Accrual", reserve: "3" }, (v) => ({
    reserve: !/^\d+$/.test(v.reserve) || +v.reserve < 1 || +v.reserve > 24 ? "Enter a whole number of months between 1 and 24." : "",
  }));
  const [toggles, setToggles] = useState<Record<string, boolean>>({ calc: true, charts: true, train: false, nBud: true, nCash: true, nAnom: true, nTask: true, nWeekly: false, nProd: false, twofa: true, newSignin: true });
  const t = (k: string, label: string) => <Switch checked={toggles[k]} label={label} onChange={(v) => { setToggles({ ...toggles, [k]: v }); toast(`${label} ${v ? "on" : "off"}`); }} />;
  const [dialog, setDialog] = useState<"password" | "delete" | "2fa" | null>(null);
  const [sessions, setSessions] = useState([["Chrome on Windows", "Addis Ababa · This device", true], ["Fremwork for iOS", "Addis Ababa · 2 hours ago", false], ["Safari on macOS", "Nairobi · Oct 12", false]] as [string, string, boolean][]);

  return (
    <div className="page">
      <div><span className="overline">Account</span><h1 style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em" }}>Settings</h1></div>
      <div className="grid" style={{ gridTemplateColumns: "220px minmax(0,1fr)", gap: 28, alignItems: "start" }} id="settings-grid">
        <nav aria-label="Settings sections" style={{ display: "flex", flexDirection: "column", gap: 2, overflowX: "auto" }} id="settings-nav">
          {TABS.map((x) => (
            <button key={x.k} type="button" className="nav-item" aria-current={tab === x.k ? "page" : undefined} onClick={() => go(x.k)}><x.icon size={18} aria-hidden /><span className="label">{x.l}</span></button>
          ))}
        </nav>
        <section className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {tab === "profile" && <>
            <div><h2 style={{ margin: 0, fontSize: 18 }}>Profile</h2><p className="muted" style={{ margin: "4px 0 0" }}>How you appear in Fremwork and on shared reports.</p></div>
            <div className="form-grid">
              <Field id="p-name" label="Full name" error={profile.err("name")}>{(a) => <input {...a} className="input" value={profile.v.name} onChange={profile.set("name")} />}</Field>
              <Field id="p-email" label="Email" error={profile.err("email")} hint="We’ll send a link to confirm a new address.">{(a) => <input {...a} type="email" className="input" value={profile.v.email} onChange={profile.set("email")} />}</Field>
              <Field id="p-role" label="Role">{(a) => <input {...a} className="input" value={profile.v.role} onChange={profile.set("role")} />}</Field>
              <Field id="p-tz" label="Time zone">{(a) => <select {...a} className="select" value={profile.v.tz} onChange={profile.set("tz")}><option>America/Los_Angeles</option><option>Africa/Addis_Ababa</option><option>Africa/Nairobi</option><option>Europe/London</option></select>}</Field>
            </div>
            <SaveBar f={profile} toast={toast} />
          </>}
          {tab === "company" && <>
            <div><h2 style={{ margin: 0, fontSize: 18 }}>Company information</h2><p className="muted" style={{ margin: "4px 0 0" }}>Used on report headers and for tax and fiscal settings.</p></div>
            <div className="form-grid">
              <Field id="c-name" label="Legal name" error={company.err("name")}>{(a) => <input {...a} className="input" value={company.v.name} onChange={company.set("name")} />}</Field>
              <Field id="c-ind" label="Industry">{(a) => <select {...a} className="select" value={company.v.industry} onChange={company.set("industry")}><option>Software & SaaS</option><option>Professional services</option><option>Retail</option><option>Manufacturing</option></select>}</Field>
              <Field id="c-country" label="Country of registration">{(a) => <select {...a} className="select" value={company.v.country} onChange={company.set("country")}><option>Ethiopia</option><option>Kenya</option><option>United States</option><option>United Kingdom</option></select>}</Field>
              <Field id="c-tin" label="Tax ID (TIN)" error={company.err("tin")} hint="Optional. Shown on statements.">{(a) => <input {...a} className="input" inputMode="numeric" value={company.v.tin} onChange={company.set("tin")} placeholder="0000000000" />}</Field>
              <Field id="c-addr" label="Registered address" className="full">{(a) => <textarea {...a} className="textarea" rows={2} value={company.v.address} onChange={company.set("address")} />}</Field>
            </div>
            <SaveBar f={company} toast={toast} />
          </>}
          {tab === "finance" && <>
            <div><h2 style={{ margin: 0, fontSize: 18 }}>Financial preferences</h2><p className="muted" style={{ margin: "4px 0 0" }}>Defaults for analysis, reports and forecasts.</p></div>
            <div className="form-grid">
              <Field id="f-cur" label="Reporting currency" hint="Changing this converts history at month-end rates.">{(a) => <select {...a} className="select" value={finance.v.currency} onChange={finance.set("currency")}><option>USD — US dollar</option><option>ETB — Ethiopian birr</option><option>KES — Kenyan shilling</option><option>EUR — Euro</option></select>}</Field>
              <Field id="f-fy" label="Fiscal year starts">{(a) => <select {...a} className="select" value={finance.v.fy} onChange={finance.set("fy")}><option>January</option><option>April</option><option>July</option><option>October</option></select>}</Field>
              <Field id="f-basis" label="Accounting basis">{(a) => <select {...a} className="select" value={finance.v.basis} onChange={finance.set("basis")}><option>Accrual</option><option>Cash</option></select>}</Field>
              <Field id="f-res" label="Cash reserve policy (months)" error={finance.err("reserve")} hint="Fremwork warns you when cash falls below this.">{(a) => <input {...a} className="input" inputMode="numeric" value={finance.v.reserve} onChange={finance.set("reserve")} />}</Field>
            </div>
            <SaveBar f={finance} toast={toast} />
          </>}
          {tab === "ai" && <>
            <div><h2 style={{ margin: 0, fontSize: 18 }}>AI model preferences</h2><p className="muted" style={{ margin: "4px 0 0" }}>Choose the default reasoning mode in any chat. These settings apply to every answer.</p></div>
            <div>
              <Row title="Show calculations" sub="Include the working behind every number.">{t("calc", "Show calculations")}</Row>
              <Row title="Add charts automatically" sub="Draw a chart when an answer compares periods or categories.">{t("charts", "Add charts automatically")}</Row>
              <Row title="Use my conversations to improve Fremwork" sub="Off by default. Your financial data is never shared with other customers.">{t("train", "Use conversations to improve Fremwork")}</Row>
            </div>
          </>}
          {tab === "notifications" && <>
            <div><h2 style={{ margin: 0, fontSize: 18 }}>Notifications</h2><p className="muted" style={{ margin: "4px 0 0" }}>Choose what Fremwork tells you about.</p></div>
            <div>
              <Row title="Budget alerts" sub="When a category passes 90% or goes over budget.">{t("nBud", "Budget alerts")}</Row>
              <Row title="Cash flow warnings" sub="When runway falls below your reserve policy.">{t("nCash", "Cash flow warnings")}</Row>
              <Row title="Unusual transactions" sub="Large, duplicate or out-of-policy payments.">{t("nAnom", "Unusual transactions")}</Row>
              <Row title="Scheduled task results" sub="When a recurring analysis finishes or fails.">{t("nTask", "Scheduled task results")}</Row>
              <Row title="Weekly email digest" sub="A Monday summary of last week’s numbers.">{t("nWeekly", "Weekly email digest")}</Row>
              <Row title="Product updates" sub="New features and improvements.">{t("nProd", "Product updates")}</Row>
            </div>
          </>}
          {tab === "security" && <>
            <div><h2 style={{ margin: 0, fontSize: 18 }}>Security</h2><p className="muted" style={{ margin: "4px 0 0" }}>Protect your account and your financial data.</p></div>
            <div>
              <Row title="Two-step verification" sub="Require a code from your authenticator app at sign-in."><Switch checked={toggles.twofa} label="Two-step verification" onChange={(v) => (v ? (setToggles({ ...toggles, twofa: true }), toast("Two-step verification on")) : setDialog("2fa"))} /></Row>
              <Row title="Alert on new sign-ins" sub="Email me when my account is used on a new device.">{t("newSignin", "New sign-in alerts")}</Row>
              <Row title="Password" sub="Last changed 3 months ago"><button className="btn sm" onClick={() => setDialog("password")}>Change password</button></Row>
            </div>
            <div>
              <div className="overline" style={{ marginBottom: 8 }}>Active sessions</div>
              <div className="card">
                {sessions.map(([d, w, cur]) => (
                  <div key={d} className="list-row"><span className="main"><b>{d}</b><small>{w}</small></span>
                    {cur ? <span className="status ok">Current</span> : <button className="btn sm text-danger" onClick={() => { setSessions(sessions.filter((s) => s[0] !== d)); toast(`Signed out of ${d}`); }}>Sign out</button>}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ border: "1px solid var(--neg-line)", borderRadius: 12, padding: 16, display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
              <div><b style={{ fontWeight: 500 }}>Delete workspace</b><p className="muted" style={{ margin: "2px 0 0", fontSize: 13 }}>Permanently delete Harbor &amp; Pine Co. and everything in it.</p></div>
              <button className="btn text-danger" style={{ borderColor: "var(--neg-line)" }} onClick={() => setDialog("delete")}>Delete workspace</button>
            </div>
          </>}
          {tab === "billing" && <>
            <div><h2 style={{ margin: 0, fontSize: 18 }}>Subscription &amp; billing</h2><p className="muted" style={{ margin: "4px 0 0" }}>Your plan, usage and invoices.</p></div>
            <Banner tone="warn" title="Your card expires next month.">Update it before Nov 14 so your renewal doesn’t fail.</Banner>
            <div className="card card-pad" style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
              <div><span className="mono" style={{ fontSize: 10, background: "var(--volt)", padding: "1px 7px", borderRadius: 999, fontWeight: 500 }}>PRO</span><div style={{ fontSize: 22, fontWeight: 600, marginTop: 6 }}>Fremwork Pro</div><small className="muted">[YOUR PRICE] a month · renews Nov 14, 2026</small></div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button className="btn" onClick={() => toast("Plan changes arrive with the billing backend")}>Change plan</button><button className="btn primary" onClick={() => toast("Upgrades arrive with the billing backend")}>Upgrade to Business</button></div>
            </div>
            <div className="grid cols-3">
              {([["AI analyses", 342, 1000], ["File uploads", 186, 200], ["Team seats", 3, 5]] as const).map(([l, a, b]) => (
                <div key={l} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><b style={{ fontWeight: 500 }}>{l}</b><span className="muted num">{a.toLocaleString()} / {b.toLocaleString()}</span></div>
                  <Progress value={(a / b) * 100} tone={a / b >= 0.9 ? "near" : undefined} />
                  {a / b >= 0.9 && <small style={{ color: "var(--warn)", fontSize: 12 }}>Almost at your limit. Uploads pause at {b}.</small>}
                </div>
              ))}
            </div>
            <Row title="Payment method" sub="Visa ending 4417 · expires 11/26"><button className="btn sm" onClick={() => toast("Card updates arrive with the billing backend")}>Update</button></Row>
          </>}
        </section>
      </div>
      <style>{`@media (max-width: 860px) { #settings-grid { grid-template-columns: minmax(0,1fr) !important; } #settings-nav { flex-direction: row !important; } #settings-nav .nav-item { width: auto; } }`}</style>
      {dialog === "password" && <PasswordDialog onClose={() => setDialog(null)} />}
      {dialog === "delete" && <DeleteWorkspace onClose={() => setDialog(null)} />}
      {dialog === "2fa" && <ConfirmDialog danger title="Turn off two-step verification?" confirmLabel="Turn off" onClose={() => setDialog(null)} body="Anyone with your password could sign in to your financial data. We recommend keeping it on." onConfirm={() => { setToggles({ ...toggles, twofa: false }); setDialog(null); toast("Two-step verification off", "err"); }} />}
    </div>
  );
}

export default function SettingsPage() {
  return <Suspense><SettingsInner /></Suspense>;
}
