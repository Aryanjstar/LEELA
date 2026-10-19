"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Brand } from "../../components/brand";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        setError(body?.error?.message || "Could not sign in.");
        return;
      }
      router.push("/studio");
    } catch {
      setError("The studio did not answer. Try again in a moment.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="auth">
      <form onSubmit={submit} className="glass">
        <Brand />
        <h1>Sign in</h1>
        <p className="muted" style={{ margin: 0 }}>Invite-only. Use the owner account created for this studio.</p>
        <input className="field" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" required />
        <input className="field" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" required />
        {error ? <p className="error">{error}</p> : null}
        <button className="btn" type="submit" disabled={pending}>{pending ? "Checking…" : "Enter the studio"}</button>
        <Link href="/" className="fine">Back to the films</Link>
      </form>
    </main>
  );
}
