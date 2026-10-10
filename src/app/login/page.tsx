import { redirect } from "next/navigation";
import { getVisitor } from "@/lib/auth";
import { VisitorAuthForm } from "@/components/visitor-auth-form";
export default async function LoginPage() {
  if (await getVisitor()) redirect("/favourites");
  return (
    <main className="admin-main">
      <VisitorAuthForm mode="login" />
    </main>
  );
}
