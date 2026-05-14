import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  turbopack: {
    root: path.join(__dirname),
  },
  experimental: {
    optimizePackageImports: ['@stacks/connect', '@stacks/network', '@stacks/transactions', 'lucide-react'],
  },
};

export default nextConfig;
