# TradeLink Web (Next.js)

Frontend for the TradeLink FastAPI + PostgreSQL auction API.

## Features
- Browse auctions by status (Live / Upcoming / Ended / All)
- **three.js 3D visuals**: animated hero scene on the home page and a reactive "bid orb" on each auction (pulses on every new bid)
- Register (buyer or seller) and log in with JWT
- Auction detail page with countdown, bid history and bid form
- **Real-time bids** over the API's WebSocket (auto-reconnect; polling fallback for logged-out visitors)
- Sellers can list new auctions with a photo picked from their computer (amounts entered in ₹, converted to paise)

## Run it

1. Start the backend (from the `tradelink` folder): `uvicorn app.main:app --reload` → http://127.0.0.1:8000
2. In this folder:

```bash
npm install
cp .env.local.example .env.local   # adjust if your API is elsewhere
npm run dev
```

Open http://localhost:3000.

## How it talks to the API
- REST calls go to `/api/*`, which `next.config.mjs` proxies to FastAPI (`API_URL`). This avoids CORS, since the backend has no CORS middleware.
- The WebSocket connects straight to `NEXT_PUBLIC_WS_URL` (browsers don't apply CORS to WebSockets).

## Known limits (from the backend)
- The API exposes no user names for bidders, so bid history shows `Bidder #id`.
- Auction list items have no current price, so cards show the starting price.
- There is no "my auctions / my bids" endpoint yet.
- Winning is not payment — no payment flow exists.
- Token is kept in `localStorage` for simplicity; use httpOnly cookies for production.

## Image uploads (backend change required)
Add `routes_uploads.py` to the FastAPI `app/` folder and register it in `app/main.py`
(see the instructions that came with this update). Images are stored in `uploads/` and
served from `/uploads/files/...`.
