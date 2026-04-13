/**
 * Prisma client singleton.
 * Prevents multiple instances during hot-reload in development.
 * Returns null when DATABASE_URL is not configured (demo mode).
 */
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient | null {
  if (!process.env.DATABASE_URL) return null;
  try {
    return new PrismaClient({ log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'] });
  } catch {
    return null;
  }
}

export const prisma: PrismaClient | null =
  globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production' && prisma) {
  globalForPrisma.prisma = prisma;
}
