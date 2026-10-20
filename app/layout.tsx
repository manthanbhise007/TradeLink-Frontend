import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "TradeLink — Live timed auctions",
  description: "Bid in real time on timed product auctions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
          <footer className="py-10 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} TradeLink. A winning bid is not a payment — payments are not yet implemented.
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
