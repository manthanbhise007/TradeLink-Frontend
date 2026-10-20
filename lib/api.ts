import type { Auction, AuctionDetail, AuctionStatus, Bid, User } from "./types";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}

type Opts = { method?: string; token?: string | null; json?: unknown; form?: Record<string, string>; multipart?: FormData };

async function request<T>(path: string, { method = "GET", token, json, form, multipart }: Opts = {}): Promise<T> {
  const headers: Record<string, string> = {};
  let body: BodyInit | undefined;
  if (json !== undefined) { headers["Content-Type"] = "application/json"; body = JSON.stringify(json); }
  if (form) { headers["Content-Type"] = "application/x-www-form-urlencoded"; body = new URLSearchParams(form).toString(); }
  if (multipart) body = multipart; // browser sets the multipart boundary header itself
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`/api${path}`, { method, headers, body, cache: "no-store" });
  } catch {
    throw new ApiError("Cannot reach the server. Is the API running?", 0);
  }
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (typeof data.detail === "string") msg = data.detail;
      else if (Array.isArray(data.detail)) msg = data.detail.map((d: { msg: string }) => d.msg).join("; ");
    } catch { /* ignore */ }
    throw new ApiError(msg, res.status);
  }
  return res.json() as Promise<T>;
}

export const api = {
  register: (p: { name: string; email: string; password: string; role: string }) =>
    request<User>("/auth/register", { method: "POST", json: p }),
  login: (email: string, password: string) =>
    request<{ access_token: string }>("/auth/login", { method: "POST", form: { username: email, password } }),
  me: (token: string) => request<User>("/auth/me", { token }),
  listAuctions: (status?: AuctionStatus) =>
    request<Auction[]>(`/auctions?limit=60${status ? `&status=${status}` : ""}`),
  getAuction: (id: number) => request<AuctionDetail>(`/auctions/${id}`),
  listBids: (id: number) => request<Bid[]>(`/auctions/${id}/bids?limit=50`),
  placeBid: (id: number, amount_paise: number, token: string) =>
    request<Bid>(`/auctions/${id}/bids`, { method: "POST", json: { amount_paise }, token }),
  uploadImage: (file: File, token: string) => {
    const fd = new FormData();
    fd.append("file", file);
    return request<{ url: string }>("/uploads", { method: "POST", multipart: fd, token });
  },
  createAuction: (p: Record<string, unknown>, token: string) =>
    request<Auction>("/auctions", { method: "POST", json: p, token }),
};
