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
      {
        pathname: "/brand/**",
      },
      {
        pathname: "/images/**",
      },
    ],
  },
  turbopack: { root: process.cwd() },
};

export default nextConfig;
