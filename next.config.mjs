
/** @type {import('next').NextConfig} */

const API =
  process.env.API_URL ||
  "https://tradelink-backend-p3kw.onrender.com";

const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API}/:path*`,
      },
    ];
  },
};

export default nextConfig;
