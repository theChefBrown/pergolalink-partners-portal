import type { NextConfig } from "next";

// Static export so the demo can be hosted on GitHub Pages. NEXT_PUBLIC_BASE_PATH
// is "/<repository-name>" on a project site and empty locally.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  images: { unoptimized: true },
};

export default nextConfig;
