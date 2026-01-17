import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow cross-origin requests from Farcaster hosts
  async headers() {
    return [
      {
        source: "/.well-known/farcaster.json",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
