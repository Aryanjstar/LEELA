"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Brand } from "../../components/brand";

type Card = { id: string; title: string; mode: string; format: string; badge: string; targetMs?: number };

const prompts = ["Why the moon misses the Earth", "How binary search finds one name", "A lattu that will not fall"];

export default function StudioPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [items, setItems] = useState<Card[]>([]);
  const [topic, setTopic] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [mode, setMode] = useState("explainer");

  useEffect(() => {
    fetch("/api/auth/session").then(async (response) => {
      if (!response.ok) {
        router.replace("/sign-in");
        return;
      }
      const body = await response.json();
      setName(body.user.name);
      const projects = await fetch("/api/projects");
      const list = await projects.json();
      if (!projects.ok) {
        setError(list?.error?.message || "Could not load projects.");
        return;
      }
      setItems(list.items || []);
    });
  }, [router]);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode, topic, title: topic.slice(0, 80) || "Untitled" }),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body?.error?.message || "Could not create that project.");
      return;
    }
    router.push(`/studio/p/${body.project.id}`);
  }

  async function remove(id: string) {
    if (!confirm("Delete this project?")) return;
    const response = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (response.status === 204) setItems((current) => current.filter((item) => item.id !== id));
  }

  const shown = items.filter((item) => filter === "all" || item.badge === filter || item.mode === filter);

  return (
    <main className="app">
      <header className="site-bar">
        <Brand href="/studio" />
        <nav className="site-nav" aria-label="Studio">
          <Link href="/studio">Projects</Link>
          <Link href="/studio/settings">Settings</Link>
          <Link href="/">Films</Link>
        </nav>
        <div className="site-bar-end">
          <span className="muted">{name}</span>
          <button className="btn ghost" type="button" onClick={async () => { await fetch("/api/auth/sign-out", { method: "POST" }); router.push("/"); }}>Sign out</button>
        </div>
      </header>

      <form onSubmit={create} className="glass composer">
        <label style={{ fontFamily: "var(--font-display)", fontSize: 32, letterSpacing: "-0.04em" }}>What shall we make?</label>
        <input className="field" value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="A topic, in one sentence" />
        <div className="chips">
          {prompts.map((prompt) => (
            <button key={prompt} className="chip" type="button" onClick={() => setTopic(prompt)}>{prompt}</button>
          ))}
        </div>
        <div className="chips">
          {["explainer", "code_lab", "story", "audio", "cartoon", "montage"].map((value) => (
            <button key={value} className={mode === value ? "chip is-on" : "chip"} type="button" onClick={() => setMode(value)}>{value}</button>
          ))}
        </div>
        <div className="row-actions">
          <button className="btn" type="submit">Start</button>
          <Link href="/studio/library">Library</Link>
        </div>
        {error ? <p className="error">{error}</p> : null}
      </form>

      <div className="chips" style={{ marginTop: 18 }}>
        {["all", "draft", "ready", "failed", "explainer"].map((value) => (
          <button key={value} className={filter === value ? "chip is-on" : "chip"} type="button" onClick={() => setFilter(value)}>{value}</button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="muted" style={{ marginTop: 28 }}>No projects in this view. Try “How binary search finds one name”.</p>
      ) : (
        <section className="cards">
          {shown.map((item) => (
            <article key={item.id} className="clay card">
              <div className="card-top">
                <Link href={`/studio/p/${item.id}`}><strong>{item.title}</strong></Link>
                <span className="badge">{item.badge}</span>
              </div>
              <p className="muted" style={{ margin: 0 }}>{item.mode} · {item.format}{item.targetMs ? ` · ${Math.round(item.targetMs / 1000)}s` : ""}</p>
              <button className="btn ghost" type="button" onClick={() => remove(item.id)}>Delete</button>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
