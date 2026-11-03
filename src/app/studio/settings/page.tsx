"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Brand } from "../../../components/brand";

export default function SettingsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [connectNote, setConnectNote] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [invites, setInvites] = useState<{ id: string; email: string; expiresAt: string; usedAt?: string; revokedAt?: string }[]>([]);

  async function loadInvites() {
    const response = await fetch("/api/invites");
    if (response.ok) setInvites((await response.json()).items);
  }

  useEffect(() => {
    fetch("/api/auth/session").then(async (response) => {
      if (!response.ok) return;
      const body = await response.json();
      setName(body.user.name);
      setEmail(body.user.email);
      setIsOwner(body.user.isOwner);
      if (body.user.isOwner) void loadInvites();
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
      {isOwner ? <section className="glass panel" style={{ maxWidth: 520 }}>
        <p className="kicker">Invitations</p>
        <form onSubmit={async event => {
          event.preventDefault(); setInviteError(""); setInviteUrl("");
          const response = await fetch("/api/invites", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: inviteEmail }) });
          const body = await response.json();
          if (!response.ok) { setInviteError(body?.error?.message || "Could not create an invitation."); return; }
          setInviteUrl(body.url); setInviteEmail(""); await loadInvites();
        }}>
          <label htmlFor="invite-email">Creator email</label>
          <input id="invite-email" className="field" type="email" required value={inviteEmail} onChange={event => setInviteEmail(event.target.value)} />
          <button className="btn" type="submit">Create invitation</button>
        </form>
        {inviteError ? <p className="error" role="alert">{inviteError}</p> : null}
        {inviteUrl ? <><p className="fine">Copy and share this private link. It is shown once and expires in seven days.</p><input className="field" aria-label="Invitation link" readOnly value={inviteUrl} onFocus={event => event.currentTarget.select()} /></> : null}
        {invites.map(invite => <p className="fine" key={invite.id}>{invite.email} · {invite.usedAt ? "Joined" : invite.revokedAt ? "Revoked" : new Date(invite.expiresAt) <= new Date() ? "Expired" : "Pending"} {(!invite.usedAt && !invite.revokedAt && new Date(invite.expiresAt) > new Date()) ? <button type="button" onClick={async () => { await fetch(`/api/invites/${invite.id}/revoke`, { method: "POST" }); await loadInvites(); }}>Revoke</button> : null}</p>)}
      </section> : null}
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
