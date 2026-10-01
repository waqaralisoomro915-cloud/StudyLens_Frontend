"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, ArrowRight } from "lucide-react";
import { api } from "@/lib/api/client";
import ThemeToggle from "@/features/theme/ThemeToggle";
export default function AuthForm({
  mode,
  uid,
  token,
}: {
  mode: string;
  uid?: string;
  token?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [message, setMessage] = useState("");
  const title =
    mode === "register"
      ? "A fresh start for your studies."
      : mode === "login"
        ? "Welcome back."
        : mode === "forgot-password"
          ? "Let’s get you back in."
          : "Choose a new password.";
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const values = Object.fromEntries(new FormData(e.currentTarget));
      await api("auth/" + mode + "/", "POST", { ...values, uid, token });
      if (mode === "login" || mode === "register")
        router.push(mode === "register" ? "/profile" : "/dashboard");
      else
        setMessage(
          mode === "forgot-password"
            ? "If your account exists, check your email for a reset link."
            : "Password updated. You can sign in.",
        );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth">
      <aside>
        <Link href="/" className="brand">
          <span className="logo">
            <BookOpen />
          </span>
          StudyLens
        </Link>
        <div>
          <span className="eyebrow">A LITTLE CLARITY, EVERY DAY</span>
          <h1>
            Make room for
            <br />
            <em>understanding.</em>
          </h1>
          <p>Your notes, your pace, your next chapter.</p>
        </div>
        <small>Private learning. Locally powered.</small>
      </aside>
      <section>
        <div className="auth-theme">
          <ThemeToggle />
        </div>
        <form method="post" onSubmit={submit}>
          <span className="eyebrow">YOUR STUDY SPACE</span>
          <h2>{title}</h2>
          <p className="muted">
            {mode === "register"
              ? "Create your account. We’ll help organize what comes next."
              : "Pick up where you left off."}
          </p>
          {["login", "register"].includes(mode) && (
            <label>
              Username
              <input name="username" required autoComplete="username" />
            </label>
          )}
          {["register", "forgot-password"].includes(mode) && (
            <label>
              Email
              <input name="email" type="email" required autoComplete="email" />
            </label>
          )}
          {mode !== "forgot-password" && (
            <label>
              Password
              <input
                name="password"
                type="password"
                required
                minLength={mode === "login" ? 1 : 10}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
              />
            </label>
          )}
          {error && (
            <p className="alert error" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="alert" role="status">
              {message}
            </p>
          )}
          <button disabled={busy || !ready}>
            {busy
              ? "Please wait…"
              : mode === "login"
                ? "Sign in"
                : mode === "register"
                  ? "Create account"
                  : "Continue"}
            <ArrowRight size={17} />
          </button>
          <div className="auth-links">
            <Link href={mode === "register" ? "/login" : "/register"}>
              {mode === "register"
                ? "Already have an account? Sign in"
                : "New here? Create an account"}
            </Link>
            <Link href="/forgot-password">Forgot password?</Link>
            <Link href="/login">Back to sign in</Link>
          </div>
        </form>
      </section>
    </main>
  );
}
