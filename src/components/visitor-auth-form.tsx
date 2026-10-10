"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useVisitor } from "@/components/visitor-session";
export function VisitorAuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const { setUser } = useVisitor();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const signup = mode === "signup";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const values = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.get("email"),
          password: values.get("password"),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Please try again.");
      setUser(data.user);
      router.replace("/favourites");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="login-panel visitor-login">
      <span className="eyebrow">YOUR NEIGHBOURHOOD, A LITTLE MORE YOU</span>
      <h1>{signup ? "Make yourself at home." : "Good to see you again."}</h1>
      <p>
        {signup
          ? "Create an account and find more of the things you love."
          : "Sign in, pick your favourite categories, and find your next plan."}
      </p>
      <form className="admin-form" onSubmit={submit}>
        <label>
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            maxLength={254}
            placeholder="you@example.com"
          />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            required
            minLength={signup ? 12 : 1}
            maxLength={256}
            autoComplete={signup ? "new-password" : "current-password"}
          />
        </label>
        {signup && <p className="password-hint">Use at least 12 characters.</p>}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="button" disabled={busy}>
          {busy
            ? signup
              ? "Creating your account…"
              : "Signing in…"
            : signup
              ? "Create account ↗"
              : "Sign in ↗"}
        </button>
      </form>
      <p className="auth-switch">
        {signup ? "Already part of the neighbourhood?" : "New around here?"}{" "}
        <Link href={signup ? "/login" : "/signup"}>
          {signup ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </section>
  );
}
