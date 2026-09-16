import "dotenv/config";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../src/generated/prisma/client";

const DEFAULT_USER_ID = "user_default_local";

async function main() {
  const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  await prisma.user.upsert({
    where: { id: DEFAULT_USER_ID },
    update: {},
    create: {
      id: DEFAULT_USER_ID,
      name: "You",
    },
  });

  console.log(`Seeded default user: ${DEFAULT_USER_ID}`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
