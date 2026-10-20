import type { AuctionStatus } from "./types";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", minimumFractionDigits: 0, maximumFractionDigits: 2,
});

export const formatINR = (paise: number) => inr.format(paise / 100);
export const rupeesToPaise = (rupees: number) => Math.round(rupees * 100);

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

/** Status derived from the clock, so the UI is correct even before the server updates it. */
export function effectiveStatus(a: { status: AuctionStatus; start_time: string; end_time: string }): AuctionStatus {
  const now = Date.now();
  if (now >= new Date(a.end_time).getTime()) return "ended";
  if (now >= new Date(a.start_time).getTime()) return "active";
  return a.status === "ended" ? "ended" : "scheduled";
}

export function formatDuration(ms: number) {
  if (ms <= 0) return "0s";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  return `${m}m ${sec}s`;
}
