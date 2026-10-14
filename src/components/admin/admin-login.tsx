"use client";
import { RequiredMark } from "@/components/shared/required-mark";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useFormValidation } from "@/hooks/shared/use-form-validation";
import { FieldError } from "@/components/shared/field-error";
import { loginInput } from "@/lib/visitor-validation";
import Link from "next/link";
import { requestJson, jsonBody } from "@/lib/client-api";

export function AdminLogin() {
  const validation = useFormValidation();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const input = validation.validate(
      loginInput,
      { email, password },
      event.currentTarget,
    );
    if (!input) return;
    setBusy(true);
    try {
      await requestJson(
        "/api/admin/login",
        { method: "POST", ...jsonBody(input) },
        "Login failed.",
      );
      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ap-login-container">
      <section className="ap-login-card">
        <div className="ap-login-header">
          <div className="ap-login-badge">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>ADMIN ACCESS</span>
          </div>
          <h1 className="ap-login-title">Admin sign in</h1>
          <p className="ap-login-desc">
            Sign in to create, edit and manage community events.
          </p>
        </div>

        <form
          noValidate
          onChange={(event) => {
            validation.clear(
              (event.target as unknown as HTMLInputElement).name,
            );
            setError("");
          }}
          onSubmit={submit}
          className="ap-login-form"
        >
          <div className="ap-field">
            <label htmlFor="admin-email" className="ap-label">
              <span>
                Email address <RequiredMark />
              </span>
            </label>
            <div className="ap-input-icon-wrap">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="ap-input-icon"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <input
                id="admin-email"
                name="email"
                {...validation.props("email")}
                type="email"
                required
                autoComplete="username"
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your admin email"
                className="ap-input ap-input-with-icon"
              />
            </div>
            <FieldError
              id={validation.errorId("email")}
              message={validation.errors.email}
            />
          </div>

          <div className="ap-field">
            <label htmlFor="admin-password" className="ap-label">
              <span>
                Password <RequiredMark />
              </span>
            </label>
            <div className="ap-input-icon-wrap">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="ap-input-icon"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                id="admin-password"
                name="password"
                {...validation.props("password")}
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                maxLength={256}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="ap-input ap-input-with-icon"
              />
              <button
                type="button"
                className="ap-password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            <FieldError
              id={validation.errorId("password")}
              message={validation.errors.password}
            />
          </div>

          {error && (
            <div className="ap-alert ap-alert-error" role="alert">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="ap-btn ap-btn-primary ap-btn-full"
            disabled={busy}
          >
            {busy ? (
              <>
                <span className="ap-spinner" />
                Signing in…
              </>
            ) : (
              <>
                <span>Sign in</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </>
            )}
          </button>
        </form>

        <div className="ap-login-footer">
          <Link href="/" className="ap-login-back-link">
            ← Back to events
          </Link>
        </div>
      </section>
    </div>
  );
}
