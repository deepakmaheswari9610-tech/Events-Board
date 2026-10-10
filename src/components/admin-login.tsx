"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
export function AdminLogin() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const values = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.get("email"),
          password: values.get("password"),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Login failed.");
      router.replace("/admin");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Login failed. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="login-panel">
      <span className="eyebrow">FOR COMMUNITY ORGANISERS</span>
      <h1>Welcome back.</h1>
      <p>Sign in to add a new plan to the neighbourhood.</p>
      <form onSubmit={submit} className="admin-form">
        <label>
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="username"
            maxLength={254}
          />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            maxLength={256}
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="button" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </section>
  );
}
