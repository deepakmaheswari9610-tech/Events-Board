import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import { AdminBoard } from "@/components/admin/admin-board";
export default async function AdminPage() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return (
    <main className="admin-workspace">
      <AdminBoard email={admin.email} />
    </main>
  );
}
