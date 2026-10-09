import { prisma } from "./lib/prisma";

async function main() {
  const userCount = await prisma.user.count();

  console.log("PostgreSQL connection successful!");
  console.log("User record count:", userCount);
}

main()
  .catch(() => {
    console.error("Database connection failed.");
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
