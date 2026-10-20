"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    try { await login(email, password); router.push("/"); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-md">
      <form onSubmit={onSubmit} className="card space-y-4 p-8">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div><label className="label">Email</label>
          <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div><label className="label">Password</label>
          <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <button className="btn w-full" disabled={busy}>{busy ? "Logging in…" : "Log in"}</button>
        <p className="text-center text-sm text-slate-500">New here? <Link href="/register" className="font-medium text-brand-600">Create an account</Link></p>
      </form>
    </div>
  );
}
