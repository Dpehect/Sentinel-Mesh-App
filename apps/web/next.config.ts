import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@sentinel/security-core", "@sentinel/scanner-runner"],
  experimental: { optimizePackageImports: ["lucide-react"] },
};

export default nextConfig;
