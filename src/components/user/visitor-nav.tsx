"use client";
import Link from "next/link";
import { requestJson } from "@/lib/client-api";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useVisitor } from "@/components/user/visitor-session";
export function VisitorNav() {
  const { user, setUser } = useVisitor();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function logout() {
    setBusy(true);
    setError("");
    try {
      await requestJson(
        "/api/auth/logout",
        { method: "POST" },
        "Couldn’t sign out. Try again.",
      );
      setUser(null);
      window.location.assign("/");
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
        {user ? (
          <>
            <Link href="/feed" className={active("/feed")}>
              My Feed
            </Link>
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
      </nav>
      {error && (
        <p className="nav-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
