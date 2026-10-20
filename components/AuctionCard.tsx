import Link from "next/link";
import type { Auction } from "@/lib/types";
import { effectiveStatus, formatINR } from "@/lib/format";
import StatusBadge from "./StatusBadge";
import Countdown from "./Countdown";

export default function AuctionCard({ auction }: { auction: Auction }) {
  const status = effectiveStatus(auction);
  return (
    <Link href={`/auctions/${auction.id}`} className="card group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-[4/3] bg-gradient-to-br from-brand-100 to-slate-100">
        {auction.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={auction.image_url} alt={auction.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl">📦</div>
        )}
        <div className="absolute left-3 top-3"><StatusBadge status={status} /></div>
      </div>
      <div className="space-y-2 p-4">
        <h3 className="line-clamp-1 font-semibold group-hover:text-brand-600">{auction.title}</h3>
        <div>
          <p className="text-xs text-slate-500">Starting price</p>
          <p className="text-lg font-bold">{formatINR(auction.starting_price_paise)}</p>
        </div>
        <p className="text-xs text-slate-500"><Countdown startTime={auction.start_time} endTime={auction.end_time} /></p>
      </div>
    </Link>
  );
}
