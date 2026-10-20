"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Auction, AuctionStatus } from "@/lib/types";
import AuctionCard from "@/components/AuctionCard";

const HeroScene = dynamic(() => import("@/components/HeroScene"), { ssr: false });

const tabs: { label: string; value?: AuctionStatus }[] = [
  { label: "Live now", value: "active" },
  { label: "Upcoming", value: "scheduled" },
  { label: "Ended", value: "ended" },
  { label: "All" },
];

export default function Home() {
  const { user } = useAuth();
  const [tab, setTab] = useState<AuctionStatus | undefined>("active");
  const [auctions, setAuctions] = useState<Auction[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setAuctions(null);
    setError("");
    api.listAuctions(tab)
      .then((a) => !cancelled && setAuctions(a))
      .catch((e) => !cancelled && setError(e.message));
    return () => { cancelled = true; };
  }, [tab]);

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-900 via-brand-700 to-indigo-500 px-8 py-16 text-white sm:py-20">
        <HeroScene />
        <div className="relative z-10">
        <h1 className="max-w-2xl text-4xl font-extrabold leading-tight sm:text-5xl">Bid live. Win fair. Trade smarter.</h1>
        <p className="mt-4 max-w-xl text-brand-100">
          Timed auctions with real-time bid updates. Every bid is validated on the server, so the highest valid bid always wins.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#auctions" className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50">Browse auctions</a>
          {!user && <Link href="/register" className="rounded-lg border border-white/40 px-5 py-2.5 text-sm font-semibold hover:bg-white/10">Create account</Link>}
          {user?.role === "seller" && <Link href="/sell/new" className="rounded-lg border border-white/40 px-5 py-2.5 text-sm font-semibold hover:bg-white/10">List an item</Link>}
        </div>
      </div>
      </section>

      <section id="auctions">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold">Auctions</h2>
          <div className="flex rounded-lg bg-slate-200/70 p-1">
            {tabs.map((t) => (
              <button
                key={t.label}
                onClick={() => setTab(t.value)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${tab === t.value ? "bg-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        {!error && auctions === null && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="card h-64 animate-pulse bg-slate-100" />)}
          </div>
        )}
        {auctions && auctions.length === 0 && (
          <div className="card p-12 text-center text-slate-500">No auctions here yet.</div>
        )}
        {auctions && auctions.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {auctions.map((a) => <AuctionCard key={a.id} auction={a} />)}
          </div>
        )}
      </section>
    </div>
  );
}
