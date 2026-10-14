import type { Metadata } from "next";
import "./globals.css";
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
      <body>{children}</body>
    </html>
  );
}
