import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import { AdminBoard } from "@/components/admin-board";
export default async function AdminPage() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return (
    <main className="admin-main">
      <AdminBoard email={admin.email} />
    </main>
  );
}
