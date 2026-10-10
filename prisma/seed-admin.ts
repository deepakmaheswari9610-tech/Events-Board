import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";
const db = new PrismaClient();
async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 12)
    throw new Error(
      "Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters in .env.",
    );
  const existing = await db.user.findUnique({ where: { email } });
  if (existing && existing.role !== "ADMIN")
    throw new Error(
      "That email already belongs to a visitor. Choose a different admin email.",
    );
  const passwordHash = await hashPassword(password);
  await db.user.upsert({
    where: { email },
    create: { email, passwordHash, role: "ADMIN" },
    update: { passwordHash },
  });
  console.log("Admin account ready. Use the credentials configured in .env.");
}
main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
