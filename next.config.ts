import type { NextConfig } from "next";

const repoName = "MyContextaiView";
const isGithubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Avoid Next.js 15.5 devtools segment-explorer manifest corruption on Windows dev.
  devIndicators: false,
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath: isGithubPages ? `/${repoName}` : undefined,
  assetPrefix: isGithubPages ? `/${repoName}/` : undefined,
  webpack: (config) => {
    config.module.rules.push({
      test: /\.mmd$/i,
      type: "asset/source",
    });
    return config;
  },
};

export default nextConfig;
