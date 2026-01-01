import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack configuration (Next.js 16+ default)
  turbopack: {
    // Empty object to enable Turbopack without configuration errors
  },
  
  // Suppress specific warnings
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

export default nextConfig;
