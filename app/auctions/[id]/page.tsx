"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { effectiveStatus, formatDateTime, formatINR, rupeesToPaise } from "@/lib/format";
import type { AuctionDetail, Bid, WsMessage } from "@/lib/types";
import Countdown from "@/components/Countdown";
import StatusBadge from "@/components/StatusBadge";

const BidOrb = dynamic(() => import("@/components/BidOrb"), { ssr: false });

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://127.0.0.1:8000";

export default function AuctionPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { user, token } = useAuth();

  const [auction, setAuction] = useState<AuctionDetail | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [error, setError] = useState("");
  const [live, setLive] = useState(false);
  const [amount, setAmount] = useState("");
  const [bidError, setBidError] = useState("");
  const [bidOk, setBidOk] = useState("");
  const [busy, setBusy] = useState(false);
  const [, tick] = useState(0);
  const liveRef = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const [a, b] = await Promise.all([api.getAuction(id), api.listBids(id)]);
      setAuction(a); setBids(b); setError("");
    } catch (e) { setError((e as Error).message); }
  }, [id]);

  useEffect(() => { refresh(); }, [refresh]);

  // Re-render every second so status flips to "ended" on time.
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 1000); return () => clearInterval(t); }, []);

  // Fallback polling while the WebSocket is not connected (e.g. logged-out visitors).
  useEffect(() => {
    const t = setInterval(() => { if (!liveRef.current) refresh(); }, 8000);
    return () => clearInterval(t);
  }, [refresh]);

  // Live updates over WebSocket (requires a JWT).
  useEffect(() => {
    if (!token || !Number.isFinite(id)) return;
    let ws: WebSocket | null = null;
    let closed = false;
    let retry: ReturnType<typeof setTimeout>;
    let delay = 1000;

    const connect = () => {
      ws = new WebSocket(`${WS_BASE}/ws/auctions/${id}?token=${encodeURIComponent(token)}`);
      ws.onopen = () => { liveRef.current = true; setLive(true); delay = 1000; };
      ws.onmessage = (ev) => {
        const msg: WsMessage = JSON.parse(ev.data);
        if (msg.type === "snapshot") {
          setAuction((a) => a && {
            ...a, status: msg.status, end_time: msg.end_time,
            current_price_paise: msg.current_price_paise, highest_bidder_id: msg.highest_bidder_id,
          });
        } else if (msg.type === "bid_update") {
          const bid = msg.bid;
          setBids((prev) => (prev.some((b) => b.id === bid.id) ? prev : [bid, ...prev]));
          setAuction((a) => a && {
            ...a, status: "active", current_price_paise: bid.amount_paise,
            highest_bidder_id: bid.bidder_id, bid_count: a.bid_count + 1,
          });
        }
      };
      ws.onclose = () => {
        liveRef.current = false; setLive(false);
        if (!closed) { retry = setTimeout(connect, delay); delay = Math.min(delay * 2, 15000); }
      };
      ws.onerror = () => ws?.close();
    };
    connect();
    return () => { closed = true; clearTimeout(retry); ws?.close(); liveRef.current = false; setLive(false); };
  }, [id, token]);

  if (error && !auction) return <p className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>;
  if (!auction) return <div className="card h-96 animate-pulse bg-slate-100" />;

  const status = effectiveStatus(auction);
  const minBid = auction.current_price_paise + auction.min_increment_paise;
  const isSeller = user?.id === auction.seller_id;
  const iAmHighest = !!user && auction.highest_bidder_id === user.id;
  const canBid = !!user && !isSeller && status === "active";

  async function submitBid(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !auction) return;
    setBidError(""); setBidOk("");
    const paise = rupeesToPaise(Number(amount));
    if (!paise || paise < minBid) return setBidError(`Your bid must be at least ${formatINR(minBid)}.`);
    setBusy(true);
    try {
      await api.placeBid(auction.id, paise, token);
      setBidOk("Bid placed!");
      setAmount("");
      if (!liveRef.current) refresh();
    } catch (err) { setBidError((err as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <div className="space-y-6 lg:col-span-3">
        <div className="card overflow-hidden">
          <div className="aspect-[16/10] bg-gradient-to-br from-brand-100 to-slate-100">
            {auction.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={auction.image_url} alt={auction.title} className="h-full w-full object-cover" />
            ) : <div className="flex h-full items-center justify-center text-6xl">📦</div>}
          </div>
        </div>
        <div className="card p-6">
          <h2 className="mb-2 text-lg font-semibold">Description</h2>
          <p className="whitespace-pre-wrap text-slate-600">{auction.description || "No description provided."}</p>
          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-slate-500">Starts</dt><dd className="font-medium">{formatDateTime(auction.start_time)}</dd></div>
            <div><dt className="text-slate-500">Ends</dt><dd className="font-medium">{formatDateTime(auction.end_time)}</dd></div>
            <div><dt className="text-slate-500">Starting price</dt><dd className="font-medium">{formatINR(auction.starting_price_paise)}</dd></div>
            <div><dt className="text-slate-500">Min. increment</dt><dd className="font-medium">{formatINR(auction.min_increment_paise)}</dd></div>
          </dl>
        </div>
      </div>

      <aside className="space-y-6 lg:col-span-2">
        <div className="card space-y-5 p-6">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold leading-tight">{auction.title}</h1>
            <StatusBadge status={status} />
          </div>

          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 to-brand-900 p-5 text-white">
            <div className="absolute inset-y-0 right-0 w-1/2"><BidOrb pulseKey={auction.bid_count} tone={status === "active" ? "live" : status === "scheduled" ? "upcoming" : "ended"} /></div>
            <div className="relative z-10">
              <p className="text-sm text-slate-300">{auction.bid_count > 0 ? (status === "ended" ? "Winning bid" : "Current bid") : "Starting price"}</p>
              <p key={auction.current_price_paise} className="origin-left animate-flash text-4xl font-extrabold tracking-tight">{formatINR(auction.current_price_paise)}</p>
              <p className="mt-1 text-sm text-slate-300">{auction.bid_count} bid{auction.bid_count === 1 ? "" : "s"}</p>
            </div>
          </div>

          <p className="text-lg font-semibold text-brand-700"><Countdown startTime={auction.start_time} endTime={auction.end_time} /></p>

          {iAmHighest && status !== "ended" && <p className="rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-700">You are the highest bidder 🎉</p>}
          {iAmHighest && status === "ended" && <p className="rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-700">You won this auction! 🏆</p>}
          {!iAmHighest && !!user && !isSeller && status === "ended" && auction.highest_bidder_id && (
            <p className="rounded-lg bg-slate-100 p-3 text-sm text-slate-600">This auction has ended.</p>
          )}

          {canBid && (
            <form onSubmit={submitBid} className="space-y-3">
              <label className="label">Your bid (₹) — minimum {formatINR(minBid)}</label>
              <div className="flex gap-2">
                <input className="input" type="number" step="0.01" min={minBid / 100} placeholder={String(minBid / 100)}
                  value={amount} onChange={(e) => setAmount(e.target.value)} required />
                <button className="btn shrink-0" disabled={busy}>{busy ? "…" : "Place bid"}</button>
              </div>
              <button type="button" className="text-sm font-medium text-brand-600 hover:underline" onClick={() => setAmount(String(minBid / 100))}>
                Bid minimum ({formatINR(minBid)})
              </button>
              {bidError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{bidError}</p>}
              {bidOk && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{bidOk}</p>}
            </form>
          )}
          {!user && status !== "ended" && (
            <Link href="/login" className="btn w-full">Log in to bid</Link>
          )}
          {isSeller && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">This is your listing — sellers can’t bid on their own auction.</p>}
          {status === "scheduled" && !isSeller && <p className="text-sm text-slate-500">Bidding opens when the auction starts.</p>}

          <p className="flex items-center gap-2 text-xs text-slate-500">
            <span className={`h-2 w-2 rounded-full ${live ? "bg-emerald-500" : "bg-slate-300"}`} />
            {live ? "Live updates connected" : user ? "Connecting to live updates…" : "Log in for live updates (refreshing every few seconds)"}
          </p>
        </div>

        <div className="card p-6">
          <h2 className="mb-3 text-lg font-semibold">Bid history</h2>
          {bids.length === 0 ? <p className="text-sm text-slate-500">No bids yet. Be the first!</p> : (
            <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
              {bids.map((b, i) => (
                <li key={b.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-slate-600">
                    Bidder #{b.bidder_id}{user?.id === b.bidder_id && <span className="ml-1 text-brand-600">(you)</span>}
                    <span className="block text-xs text-slate-400">{formatDateTime(b.created_at)}</span>
                  </span>
                  <span className={`font-semibold ${i === 0 ? "text-emerald-600" : ""}`}>{formatINR(b.amount_paise)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
