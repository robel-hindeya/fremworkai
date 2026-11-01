"use client";

import { useRouter } from "next/navigation";
import { useChat } from "@/components/chat-store";
import { Composer } from "@/components/composer";
import { Mark, Logo } from "@/components/ui";
import {
  AlertTriangle,
  BarChart3,
  Check,
  ChevronDown,
  CreditCard,
  Scale,
  Search,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

const SUGGESTIONS = [
  {
    icon: TrendingUp,
    title: "Forecast cash runway",
    desc: "Project cash balance & burn rate for the next 90 days",
    prompt: "Can you forecast our cash balance and burn rate for the next 90 days?",
  },
  {
    icon: CreditCard,
    title: "Expense variance",
    desc: "Analyze October expenses and software subscriptions over budget",
    prompt: "Show me our October expenses breakdown and identify software subscriptions running over budget.",
  },
  {
    icon: AlertTriangle,
    title: "Receivables risk",
    desc: "Audit overdue receivables and customer concentration risk",
    prompt: "What are our biggest financial risks, overdue receivables, and client concentration?",
  },
  {
    icon: BarChart3,
    title: "Revenue comparison",
    desc: "Compare recurring SaaS vs consulting revenue streams",
    prompt: "Compare our revenue streams and performance versus previous periods.",
  },
];

export default function NewChat() {
  const { send, mode, setMode } = useChat();
  const router = useRouter();
  const [modeMenu, setModeMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setModeMenu(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const handleSelectSuggestion = (prompt: string) => {
    const convoId = send(null, prompt, []);
    router.push(`/chat/${convoId}`);
  };

  return (
    <div className="chat-layout">
      <header className="chat-top-bar">
        <div className="chat-top-left" ref={menuRef} style={{ position: "relative" }}>
          <button
            type="button"
            className="chat-model-pill"
            style={{ cursor: "pointer", border: "1px solid var(--line)" }}
            onClick={() => setModeMenu(!modeMenu)}
            aria-expanded={modeMenu}
            aria-label={`Model mode: ${mode}`}
          >
            <span className="chat-model-name">Fremwork 1.0</span>
            <span className="chat-mode-tag">{mode}</span>
            <ChevronDown size={14} style={{ transform: modeMenu ? "rotate(180deg)" : undefined }} />
          </button>
          {modeMenu && (
            <div className="menu" role="menu" style={{ top: "calc(100% + 6px)", left: 0, width: 230, zIndex: 60 }}>
              <div className="overline" style={{ padding: "6px 10px" }}>Reasoning Mode</div>
              {[
                { m: "Fast" as const, icon: Zap, label: "Fast", desc: "Instant ledger queries" },
                { m: "Balanced" as const, icon: Scale, label: "Balanced", desc: "Ledger-grounded calculations" },
                { m: "Deep Analysis" as const, icon: Search, label: "Deep Analysis", desc: "Multi-step reasoning & simulations" },
              ].map((item) => (
                <button
                  key={item.m}
                  type="button"
                  role="menuitem"
                  className="menu-item"
                  onClick={() => {
                    setMode(item.m);
                    setModeMenu(false);
                  }}
                >
                  <span className="ic-box"><item.icon size={16} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div>{item.label}</div>
                    <div className="muted" style={{ fontSize: 11.5 }}>{item.desc}</div>
                  </div>
                  {mode === item.m && <Check size={16} color="var(--blue)" />}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="mobile-logo">
          <Logo height={20} />
        </div>
      </header>

      <main className="chat-home-container">
        <div className="chat-home-inner">
          <div className="chat-hero-icon">
            <Mark size={28} />
          </div>

          <h1 className="chat-hero-title">Where should we start?</h1>

          <Composer
            autoFocus
            onSend={(text, files) => router.push(`/chat/${send(null, text, files)}`)}
          />

          <div className="chat-suggestions-grid">
            {SUGGESTIONS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.title}
                  type="button"
                  className="suggestion-card"
                  onClick={() => handleSelectSuggestion(item.prompt)}
                >
                  <div className="suggestion-header">
                    <Icon size={16} color="var(--blue)" />
                    <span>{item.title}</span>
                  </div>
                  <div className="suggestion-desc">{item.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
