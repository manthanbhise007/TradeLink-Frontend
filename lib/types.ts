export type Role = "buyer" | "seller";
export type AuctionStatus = "scheduled" | "active" | "ended";

export interface User { id: number; name: string; email: string; role: Role }

export interface Auction {
  id: number;
  seller_id: number;
  title: string;
  description: string;
  image_url: string | null;
  starting_price_paise: number;
  min_increment_paise: number;
  start_time: string;
  end_time: string;
  status: AuctionStatus;
  created_at: string;
}

export interface AuctionDetail extends Auction {
  current_price_paise: number;
  highest_bidder_id: number | null;
  bid_count: number;
}

export interface Bid {
  id: number;
  auction_id: number;
  bidder_id: number;
  amount_paise: number;
  created_at: string;
}

export type WsMessage =
  | { type: "snapshot"; auction_id: number; status: AuctionStatus; end_time: string; current_price_paise: number; highest_bidder_id: number | null }
  | { type: "bid_update"; bid: Bid };
