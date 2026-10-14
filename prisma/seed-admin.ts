import { PrismaClient } from "@prisma/client";
import { signupInput } from "../src/lib/visitor-validation";
import { hashPassword } from "../src/lib/password";
const db = new PrismaClient();
async function main() {
  const credentials = signupInput.safeParse({ email: process.env.ADMIN_EMAIL ?? "", password: process.env.ADMIN_PASSWORD ?? "" });
  if (!credentials.success) throw new Error(credentials.error.issues[0]?.message || "Configure valid ADMIN_EMAIL and ADMIN_PASSWORD values.");
  const { email, password } = credentials.data;
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
  console.log("Admin account ready. Use the credentials configured in the environment configuration.");
}
main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
