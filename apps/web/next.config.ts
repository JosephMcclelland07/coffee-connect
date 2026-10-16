import type { NextConfig } from "next";
import { resolve } from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: resolve(__dirname, "../.."),
  async rewrites() {
    return [{ source: "/api/coffee/:path*", destination: `${process.env.API_ORIGIN || "http://127.0.0.1:4000"}/:path*` }];
  },
};

export default nextConfig;
