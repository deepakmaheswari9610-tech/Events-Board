import { redirect } from "next/navigation";
import { getVisitor } from "@/lib/auth";
import { MyFeed } from "@/components/my-feed";
export default async function FeedPage() {
  if (!(await getVisitor())) redirect("/login");
  return (
    <main className="feed-main">
      <MyFeed />
    </main>
  );
}
