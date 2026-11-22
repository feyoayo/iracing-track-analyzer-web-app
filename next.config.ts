import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Full header prefetch must include content behind connection().
  partialPrefetching: false,
  experimental: {
    agentUpgrade: "latest",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
