import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import { AdminLogin } from "@/components/admin-login";
export default async function AdminLoginPage() {
  if (await getAdmin()) redirect("/admin");
  return (
    <main className="admin-main">
      <AdminLogin />
    </main>
  );
}
