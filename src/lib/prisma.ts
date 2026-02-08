import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

// Reuse pool across serverless invocations
const pool =
  globalForPrisma.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1, // Limit connections for serverless
  });

if (!globalForPrisma.pool) globalForPrisma.pool = pool;

// Reuse Prisma client across serverless invocations
const adapter = new PrismaPg(pool);
const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (!globalForPrisma.prisma) globalForPrisma.prisma = prisma;

export default prisma;
