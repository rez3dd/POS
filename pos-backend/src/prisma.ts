// src/prisma.ts
import { PrismaClient } from "@prisma/client";

// ใช้ PrismaClient แบบ singleton ป้องกันการสร้างซ้ำตอน HMR/dev
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "production" ? [] : ["query", "info", "warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
