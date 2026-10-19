"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function SharePage() {
  const params = useParams<{ token: string }>();
  const [title, setTitle] = useState("");
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    fetch(`/api/public/share/${params.token}`).then(async (response) => {
      if (!response.ok) {
        setMissing(true);
        return;
      }
      const body = await response.json();
      setTitle(body.title);
    });
  }, [params.token]);

  if (missing) {
    return (
      <main className="auth">
        <section className="glass" style={{ padding: 28 }}>
          <h1>That video is not available.</h1>
          <Link href="/">Leela</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="auth">
      <section style={{ display: "grid", gap: 12, justifyItems: "center" }}>
        <p className="kicker">Made with Leela</p>
        <h1 style={{ margin: 0 }}>{title || "…"}</h1>
        <iframe className="player" title={title || "Film"} sandbox="allow-scripts" src={`/api/public/share/${params.token}/preview`} />
      </section>
    </main>
  );
}
