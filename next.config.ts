import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === 'true';

const nextConfig: NextConfig = {
  // Static export for GitHub Pages
  output: isGitHubPages ? 'export' : undefined,
  basePath: isGitHubPages ? '/terrarium' : '',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
