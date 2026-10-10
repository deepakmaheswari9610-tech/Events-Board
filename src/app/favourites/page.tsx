import { redirect } from "next/navigation";
import { getVisitor } from "@/lib/auth";
import { FavouritePicker } from "@/components/favourite-picker";
export default async function FavouritesPage() {
  if (!(await getVisitor())) redirect("/login");
  return (
    <main className="preferences-main">
      <FavouritePicker />
    </main>
  );
}
