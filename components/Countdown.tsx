"use client";
import { useEffect, useState } from "react";
import { formatDuration } from "@/lib/format";

export default function Countdown({ startTime, endTime }: { startTime: string; endTime: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (now === null) return <span>&nbsp;</span>;
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  if (now >= end) return <span>Auction ended</span>;
  if (now < start) return <span>Starts in {formatDuration(start - now)}</span>;
  const left = end - now;
  return <span className={left < 60_000 ? "font-bold text-red-600" : ""}>{formatDuration(left)} left</span>;
}
