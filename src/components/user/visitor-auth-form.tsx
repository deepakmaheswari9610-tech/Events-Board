"use client";
import { RequiredMark } from "@/components/shared/required-mark";
import { useFormValidation } from "@/hooks/shared/use-form-validation";
import { FieldError } from "@/components/shared/field-error";
import { loginInput, signupInput } from "@/lib/visitor-validation";
import Link from "next/link";
import { requestJson, jsonBody } from "@/lib/client-api";
import type { VisitorIdentity } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useVisitor } from "@/components/user/visitor-session";
export function VisitorAuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const { setUser } = useVisitor();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const validation = useFormValidation();
  const signup = mode === "signup";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const input = validation.validate(
      signup ? signupInput : loginInput,
      values,
      event.currentTarget,
    );
    if (!input) return;
    setBusy(true);
    try {
      const data = await requestJson<{ user: VisitorIdentity }>(
        `/api/auth/${mode}`,
        {
          method: "POST",
          ...jsonBody(input),
        },
      );
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
      <span className="eyebrow">COMMUNITY EVENTS BOARD</span>
      <h1>{signup ? "Create an account" : "Sign in"}</h1>
      <p>
        {signup
          ? "Choose your favourite categories and discover local events."
          : "Sign in to view your feed, save reminders and design event cards."}
      </p>
      <form
        noValidate
        className="admin-form"
        onSubmit={submit}
        onChange={(event) => {
          const target = event.target as unknown as HTMLInputElement;
          validation.clear(target.name);
          setError("");
        }}
      >
        <label>
          <span>
            Email address <RequiredMark />
          </span>
          <input
            name="email"
            aria-label="Email address"
            {...validation.props("email")}
            type="email"
            required
            autoComplete="email"
            maxLength={254}
            placeholder="Enter your email address"
          />
          <FieldError
            id={validation.errorId("email")}
            message={validation.errors.email}
          />
        </label>
        <label>
          <span>
            Password <RequiredMark />
          </span>
          <input
            name="password"
            aria-label="Password"
            {...validation.props("password")}
            type="password"
            placeholder={signup ? "Create a password" : "Enter your password"}
            required
            minLength={signup ? 12 : 1}
            maxLength={256}
            autoComplete={signup ? "new-password" : "current-password"}
          />
          <FieldError
            id={validation.errorId("password")}
            message={validation.errors.password}
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
        {signup ? "Already have an account?" : "Don’t have an account?"}{" "}
        <Link href={signup ? "/login" : "/signup"}>
          {signup ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </section>
  );
}
