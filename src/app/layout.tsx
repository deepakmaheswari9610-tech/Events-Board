import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { VisitorSession } from "@/components/visitor-session";
import { VisitorNav } from "@/components/visitor-nav";
export const metadata: Metadata = {
  title: "Neighbourhood | Community Events Board",
  description:
    "Find your next good day. Discover local music, workshops, food, sports and family events.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <VisitorSession>
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
            Good things happen close to home.
            <span>Made for your community.</span>
          </footer>
        </VisitorSession>
      </body>
    </html>
  );
}
