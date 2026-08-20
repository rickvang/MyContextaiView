import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.module.rules.push({
      test: /\.mmd$/i,
      type: "asset/source",
    });
    return config;
  },
};

export default nextConfig;
