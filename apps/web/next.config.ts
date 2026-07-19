import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@sentinel/security-core"],
  experimental: { optimizePackageImports: ["lucide-react"] },
};

export default nextConfig;
