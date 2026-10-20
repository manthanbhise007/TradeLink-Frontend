/** @type {import('next').NextConfig} */
const API = process.env.API_URL || "https://tradelink-backend-p3kw.onrender.com";

const nextConfig = {
  // Proxy REST calls to FastAPI so the browser never makes cross-origin requests
  // (the backend has no CORS middleware).
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API}/:path*` }];
  },
};

export default nextConfig;
