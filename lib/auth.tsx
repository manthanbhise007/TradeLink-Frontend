"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "./api";
import type { User } from "./types";

interface AuthCtx {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);
const KEY = "tradelink_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    if (!saved) { setLoading(false); return; }
    api.me(saved)
      .then((u) => { setUser(u); setToken(saved); })
      .catch(() => localStorage.removeItem(KEY))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { access_token } = await api.login(email, password);
    const u = await api.me(access_token);
    localStorage.setItem(KEY, access_token);
    setToken(access_token);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(KEY);
    setToken(null);
    setUser(null);
  }, []);

  return <Ctx.Provider value={{ user, token, loading, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}
