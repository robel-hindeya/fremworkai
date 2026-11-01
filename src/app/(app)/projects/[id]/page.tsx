"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, ChevronLeft, FileText, MessageSquare, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useChat } from "@/components/chat-store";
import { useToast } from "@/components/toast";
import { Banner, Empty, PageHeader } from "@/components/ui";
import { PROJECTS } from "@/lib/data";
import { checkFiles } from "@/lib/format";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { conversations } = useChat();
  const toast = useToast();
  const project = PROJECTS.find((p) => p.id === id);
  const [docs, setDocs] = useState<string[]>(project?.docs ?? []);
  const [errors, setErrors] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!project) {
    return (
      <div className="page"><div className="card" style={{ maxWidth: 560, margin: "48px auto 0" }}>
        <Empty icon={<AlertTriangle size={18} />} title="We can’t find this project." action={<Link href="/projects" className="btn primary">See all projects</Link>}>It may have been deleted, or you don’t have access to it.</Empty>
      </div></div>
    );
  }
  const chats = conversations.filter((c) => project.chats.includes(c.id) || c.projectId === project.id);

  return (
    <div className="page">
      <Link href="/projects" className="btn sm ghost" style={{ alignSelf: "flex-start", marginLeft: -8 }}><ChevronLeft size={16} />All projects</Link>
      <PageHeader eyebrow="Project" title={project.name} sub={project.desc} demo={false}
        actions={<><button className="btn" onClick={() => fileRef.current?.click()}><Upload size={16} />Add files</button><Link href="/chat" className="btn primary">New chat in project</Link></>} />
      <input ref={fileRef} type="file" multiple hidden onChange={(e) => {
        const r = checkFiles(Array.from(e.target.files ?? []), 0);
        setDocs((d) => [...r.ok.map((f) => f.name), ...d]);
        setErrors(r.errors);
        if (r.ok.length) toast(`${r.ok.length} file${r.ok.length > 1 ? "s" : ""} added`);
        e.target.value = "";
      }} />
      {errors.length > 0 && <Banner tone="err" title="Some files weren’t added.">{errors.join(" ")}</Banner>}
      <div className="grid cols-3">
        <section className="card">
          <div className="card-head"><h3>Conversations</h3><span className="overline">{chats.length}</span></div>
          {chats.length ? chats.map((c) => <Link key={c.id} href={`/chat/${c.id}`} className="list-row"><MessageSquare size={18} color="var(--faint)" /><span className="main"><b>{c.title}</b><small>{c.messages.length} messages</small></span></Link>)
            : <Empty title="No chats yet.">Start a chat here and it stays with this project.</Empty>}
        </section>
        <section className="card">
          <div className="card-head"><h3>Documents</h3><span className="overline">{docs.length}</span></div>
          {docs.length ? docs.map((d) => <div key={d} className="list-row"><span className="tag">{d.split(".").pop()?.toUpperCase()}</span><span className="main"><b>{d}</b><small>Uploaded October 2026</small></span></div>)
            : <Empty title="No files yet.">Add statements, ledgers or decks so Fremwork can use them in this project.</Empty>}
        </section>
        <section className="card">
          <div className="card-head"><h3>Reports</h3><span className="overline">{project.reports.length}</span></div>
          {project.reports.length ? project.reports.map((r) => <Link key={r} href="/reports" className="list-row"><FileText size={18} color="var(--faint)" /><span className="main"><b>{r}</b><small>Financial report</small></span></Link>)
            : <Empty title="No reports yet.">Save one from a chat or from Financial reports.</Empty>}
        </section>
      </div>
      <section className="card card-pad"><span className="overline">Project instructions</span><p style={{ margin: "8px 0 0", maxWidth: "70ch", color: "var(--ink2)" }}>Use IFRS for SMEs presentation. Report in USD. Treat Lumen Health as a strategic account. Flag any variance above 10% against budget.</p></section>
    </div>
  );
}
