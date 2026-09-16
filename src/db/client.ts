import "server-only";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/src/generated/prisma/client";
import { env } from "@/src/lib/config/env";

type GlobalWithPrisma = typeof globalThis & {
  __prisma?: PrismaClient;
  __prismaAdapter?: PrismaLibSql;
};

const globalForPrisma = globalThis as GlobalWithPrisma;

const adapter =
  globalForPrisma.__prismaAdapter ?? new PrismaLibSql({ url: env.DATABASE_URL });

export const prisma = globalForPrisma.__prisma ?? new PrismaClient({ adapter });

if (env.NODE_ENV !== "production") {
  globalForPrisma.__prisma = prisma;
  globalForPrisma.__prismaAdapter = adapter;
}
