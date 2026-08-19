import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const globalForPrisma = globalThis;

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL environment variable is not set. " +
        "Please add your Neon connection string to .env.local"
    );
  }

  // PrismaNeon v7 takes a PoolConfig object directly (connectionString inside it)
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}

/** @type {PrismaClient} */
const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
