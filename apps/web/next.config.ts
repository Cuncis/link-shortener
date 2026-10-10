import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev server only: lets the app hydrate when opened at 127.0.0.1 instead of localhost.
  // Without it Next blocks its own scripts and the page stays on "Loading…".
  allowedDevOrigins: ["127.0.0.1"],
  // The browser calls /api/* on this origin and Next forwards it to the Nest API.
  // One origin means no CORS, and the browser never depends on reaching port 3001.
  async rewrites() {
    const apiUrl = (process.env.API_PROXY_URL ?? "http://127.0.0.1:3001").replace(/\/+$/, "");
    return [{ source: "/api/:path*", destination: `${apiUrl}/:path*` }];
  },
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
