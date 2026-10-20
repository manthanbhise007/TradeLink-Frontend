"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">T</span>
          TradeLink
        </Link>
        <div className="flex items-center gap-1">
          <Link href="/" className="btn-ghost">Browse</Link>
          {user?.role === "seller" && <Link href="/sell/new" className="btn-ghost">Sell an item</Link>}
          {loading ? null : user ? (
            <>
              <span className="hidden px-3 text-sm text-slate-600 sm:inline">
                {user.name} <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{user.role}</span>
              </span>
              <button className="btn-ghost" onClick={() => { logout(); router.push("/"); }}>Log out</button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">Log in</Link>
              <Link href="/register" className="btn ml-1">Sign up</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
