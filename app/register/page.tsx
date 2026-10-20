"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function RegisterPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "buyer" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await api.register(form);
      await login(form.email, form.password);
      router.push("/");
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-md">
      <form onSubmit={onSubmit} className="card space-y-4 p-8">
        <h1 className="text-2xl font-bold">Create your account</h1>
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div><label className="label">Name</label>
          <input className="input" required minLength={2} maxLength={100} value={form.name} onChange={set("name")} /></div>
        <div><label className="label">Email</label>
          <input className="input" type="email" required value={form.email} onChange={set("email")} /></div>
        <div><label className="label">Password</label>
          <input className="input" type="password" required minLength={8} maxLength={128} value={form.password} onChange={set("password")} />
          <p className="mt-1 text-xs text-slate-500">At least 8 characters.</p></div>
        <div>
          <label className="label">I want to</label>
          <div className="grid grid-cols-2 gap-3">
            {[{ v: "buyer", t: "Buy & bid" }, { v: "seller", t: "Sell items" }].map((r) => (
              <label key={r.v} className={`cursor-pointer rounded-lg border p-3 text-center text-sm font-medium ${form.role === r.v ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-300"}`}>
                <input type="radio" name="role" value={r.v} checked={form.role === r.v} onChange={set("role")} className="sr-only" />
                {r.t}
              </label>
            ))}
          </div>
        </div>
        <button className="btn w-full" disabled={busy}>{busy ? "Creating…" : "Sign up"}</button>
        <p className="text-center text-sm text-slate-500">Already registered? <Link href="/login" className="font-medium text-brand-600">Log in</Link></p>
      </form>
    </div>
  );
}
