"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Brand } from "../../../components/brand";

export default function SettingsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [connectNote, setConnectNote] = useState("");

  useEffect(() => {
    fetch("/api/auth/session").then(async (response) => {
      if (!response.ok) return;
      const body = await response.json();
      setName(body.user.name);
      setEmail(body.user.email);
    });
  }, []);

  return (
    <main className="app">
      <header className="site-bar">
        <Brand href="/studio" />
        <nav className="site-nav">
          <Link href="/studio">Projects</Link>
          <Link href="/studio/settings">Settings</Link>
        </nav>
      </header>
      <section className="glass panel" style={{ maxWidth: 520 }}>
        <p className="kicker">Account</p>
        <h1 style={{ margin: 0, fontSize: 40 }}>{name || "…"}</h1>
        <p className="muted" style={{ margin: 0 }}>{email}</p>
      </section>
      <section className="glass panel" style={{ maxWidth: 520 }}>
        <p className="kicker">YouTube and Instagram</p>
        <button className="btn" type="button" onClick={async () => {
          const response = await fetch("/api/connections", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ provider: "youtube" }) });
          const body = await response.json();
          setConnectNote(body?.error?.message || "Connected.");
        }}>Connect YouTube</button>
        {connectNote ? <p className="fine">{connectNote}</p> : null}
      </section>
    </main>
  );
}
