"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { rupeesToPaise } from "@/lib/format";

/** Format a Date for <input type="datetime-local"> in the user's local time. */
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

const toLocalInput = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export default function NewAuctionPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [f, setF] = useState({
    title: "", description: "", start_price: "", increment: "1",
    start_time: "", end_time: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!image) { setPreview(null); return; }
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) { setError("Please choose a JPG, PNG, GIF or WebP image."); e.target.value = ""; return; }
    if (file.size > MAX_IMAGE_BYTES) { setError("Image must be 5 MB or smaller."); e.target.value = ""; return; }
    setError("");
    setImage(file);
  }

  function removeImage() {
    setImage(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  useEffect(() => {
    const now = new Date();
    setF((p) => ({ ...p, start_time: toLocalInput(now), end_time: toLocalInput(new Date(now.getTime() + 24 * 3600 * 1000)) }));
  }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  if (loading) return <p className="text-slate-500">Loading…</p>;
  if (!user || user.role !== "seller") {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <p className="mb-4 text-slate-600">You need a <b>seller</b> account to list items.</p>
        <Link href={user ? "/" : "/login"} className="btn">{user ? "Back to browse" : "Log in"}</Link>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const start = new Date(f.start_time), end = new Date(f.end_time);
    if (end <= start) return setError("End time must be after the start time.");
    if (end.getTime() <= Date.now()) return setError("End time must be in the future.");
    setBusy(true);
    try {
      const image_url = image ? (await api.uploadImage(image, token!)).url : null;
      const a = await api.createAuction({
        title: f.title,
        description: f.description,
        image_url,
        starting_price_paise: rupeesToPaise(Number(f.start_price)),
        min_increment_paise: rupeesToPaise(Number(f.increment)),
        start_time: start.toISOString(),
        end_time: end.toISOString(),
      }, token!);
      router.push(`/auctions/${a.id}`);
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <form onSubmit={onSubmit} className="card space-y-5 p-8">
        <h1 className="text-2xl font-bold">List an item</h1>
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div><label className="label">Title</label>
          <input className="input" required minLength={3} maxLength={180} value={f.title} onChange={set("title")} /></div>
        <div><label className="label">Description</label>
          <textarea className="input min-h-[120px]" maxLength={10000} value={f.description} onChange={set("description")} /></div>
        <div>
          <label className="label">Photo (optional)</label>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={onPickImage} className="sr-only" id="image-input" />
          {preview ? (
            <div className="relative overflow-hidden rounded-xl border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Selected preview" className="max-h-64 w-full object-cover" />
              <div className="absolute right-2 top-2 flex gap-2">
                <label htmlFor="image-input" className="cursor-pointer rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold shadow hover:bg-white">Change</label>
                <button type="button" onClick={removeImage} className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold text-red-600 shadow hover:bg-white">Remove</button>
              </div>
              <p className="bg-slate-50 px-3 py-2 text-xs text-slate-500">{image?.name} · {((image?.size ?? 0) / 1024).toFixed(0)} KB</p>
            </div>
          ) : (
            <label htmlFor="image-input" className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center transition hover:border-brand-500 hover:bg-brand-50">
              <span className="text-3xl">🖼️</span>
              <span className="text-sm font-medium text-slate-700">Click to choose a photo from your computer</span>
              <span className="text-xs text-slate-500">JPG, PNG, GIF or WebP · up to 5 MB</span>
            </label>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">Starting price (₹)</label>
            <input className="input" type="number" required min="0.01" step="0.01" value={f.start_price} onChange={set("start_price")} /></div>
          <div><label className="label">Minimum bid increment (₹)</label>
            <input className="input" type="number" required min="0.01" step="0.01" value={f.increment} onChange={set("increment")} /></div>
          <div><label className="label">Starts</label>
            <input className="input" type="datetime-local" required value={f.start_time} onChange={set("start_time")} /></div>
          <div><label className="label">Ends</label>
            <input className="input" type="datetime-local" required value={f.end_time} onChange={set("end_time")} /></div>
        </div>
        <button className="btn w-full" disabled={busy}>{busy ? (image ? "Uploading & publishing…" : "Publishing…") : "Publish auction"}</button>
      </form>
    </div>
  );
}
