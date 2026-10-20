import type { AuctionStatus } from "@/lib/types";

const styles: Record<AuctionStatus, string> = {
  active: "bg-emerald-100 text-emerald-700",
  scheduled: "bg-amber-100 text-amber-700",
  ended: "bg-slate-200 text-slate-600",
};
const labels: Record<AuctionStatus, string> = { active: "Live", scheduled: "Upcoming", ended: "Ended" };

export default function StatusBadge({ status }: { status: AuctionStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}>
      {status === "active" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />}
      {labels[status]}
    </span>
  );
}
