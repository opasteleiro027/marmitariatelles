import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: process.cwd(),
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  images: {
    localPatterns: [
      {
        pathname: "/api/catalog/products/**",
      },
    ],
  },
  turbopack: { root: process.cwd() },
};

export default nextConfig;
