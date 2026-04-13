import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Suppress Prisma/bcryptjs edge-runtime warnings in dev
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
};

export default nextConfig;
