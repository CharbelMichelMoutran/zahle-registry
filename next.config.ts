import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No Next.js badge in the corner while developing (owner, 23 Nov 2026).
  devIndicators: false,
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
