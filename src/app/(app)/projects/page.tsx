"use client";

import Link from "next/link";
import { Folder, Plus } from "lucide-react";
import { useState } from "react";
import { ProjectDialog } from "@/components/forms";
import { PageHeader } from "@/components/ui";
import { PROJECTS, type Project } from "@/lib/data";

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>(PROJECTS);
  const [creating, setCreating] = useState(false);
  return (
    <div className="page">
      <PageHeader eyebrow="Workspace" title="Projects" sub="Keep related conversations, documents and reports together." demo={false}
        actions={<button className="btn primary" onClick={() => setCreating(true)}><Plus size={16} />New project</button>} />
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
        {projects.map((p) => (
          <Link key={p.id} href={`/projects/${p.id}`} className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 12, textDecoration: "none", color: "inherit", minHeight: 200 }}>
            <span className="ic-box"><Folder size={18} /></span>
            <b style={{ fontSize: 16, fontWeight: 500 }}>{p.name}</b>
            <span className="muted" style={{ fontSize: 13 }}>{p.desc}</span>
            <span className="muted" style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12.5, marginTop: "auto" }}>
              <span>{p.chats.length} chats</span><span>{p.docs.length} files</span><span>{p.reports.length} reports</span><span style={{ marginLeft: "auto" }}>{p.updated}</span>
            </span>
          </Link>
        ))}
      </div>
      {creating && <ProjectDialog taken={projects.map((p) => p.name)} onClose={() => setCreating(false)} onAdd={(n) => setProjects((ps) => [{ id: "p-" + Date.now(), name: n.name, desc: n.desc || "No description yet.", chats: [], docs: [], reports: [], updated: "Just now" }, ...ps])} />}
    </div>
  );
}
