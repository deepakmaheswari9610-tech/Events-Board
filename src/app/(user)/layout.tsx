import { getVisitor } from "@/lib/auth";
import Link from "next/link";
import { VisitorSession } from "@/components/user/visitor-session";
import { VisitorNav } from "@/components/user/visitor-nav";
export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const visitor = await getVisitor();
  const initialUser = visitor ? { id: visitor.id, email: visitor.email, role: "USER" as const } : null;
  return (
    <VisitorSession key={initialUser?.id ?? "guest"} initialUser={initialUser}>
      <header className="header">
        <Link href="/" className="brand">
          <span className="brand-icon" aria-hidden="true">
            ✳
          </span>
          <span>
            neighbourhood
            <span className="brand-caption">COMMUNITY EVENTS BOARD</span>
          </span>
        </Link>
        <VisitorNav />
      </header>
      {children}
      <footer>
        Good things happen close to home.<span>Made for your community.</span>
      </footer>
    </VisitorSession>
  );
}
