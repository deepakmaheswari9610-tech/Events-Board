"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useVisitor } from "@/components/visitor-session";
export function VisitorNav() {
  const { user, loading, setUser } = useVisitor();
  const pathname = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function logout() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Couldn’t sign out. Try again.");
      setUser(null);
      router.replace("/");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Couldn’t sign out.");
    } finally {
      setBusy(false);
    }
  }
  function active(path: string) {
    return pathname === path ? "nav-active" : "nav-link";
  }
  return (
    <div className="nav-container">
      <nav className="visitor-nav" aria-label="Main navigation">
        <Link
          href="/"
          className={
            pathname === "/" || pathname.startsWith("/events/")
              ? "nav-active"
              : "nav-link"
          }
        >
          Explore events
        </Link>
        <Link href="/feed" className={active("/feed")}>
          My Feed
        </Link>
        {loading ? (
          <span className="nav-loading" aria-label="Checking session">
            …
          </span>
        ) : user ? (
          <>
            <Link href="/favourites" className={active("/favourites")}>
              Favourites
            </Link>
            <button className="nav-logout" disabled={busy} onClick={logout}>
              {busy ? "Signing out…" : "Sign out"}
            </button>
          </>
        ) : (
          <Link href="/login" className={active("/login")}>
            Sign in
          </Link>
        )}
        <Link href="/admin" className="admin-nav">
          Admin
        </Link>
      </nav>
      {error && (
        <p className="nav-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
