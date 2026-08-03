"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setError("");
    setSent(false);
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(
        typeof data.message === "string"
          ? data.message
          : "We couldn’t send a verification code right now. Please try again shortly."
      );
      setSent(true);
    } catch (cause) {
      setError(
        cause instanceof Error && cause.message
          ? cause.message
          : "We couldn’t send a verification code right now. Please try again shortly."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#121210] px-5 py-16 text-[#f6f5ec]">
      <section className="mx-auto w-full max-w-md rounded-2xl border border-[#34342a] bg-[#1a1a13] p-8 shadow-2xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#e3f24a]">Docmind</p>
        <h1 className="text-3xl font-semibold">Reset your password</h1>
        <p className="mt-3 text-sm leading-6 text-[#b9b9ab]">Enter your email and we’ll send a six-digit verification code if the account is eligible for a password reset.</p>
        {sent ? (
          <div className="mt-7 space-y-5">
            <p className="rounded-lg border border-[#454536] bg-[#121210] p-4 text-sm leading-6 text-[#d4d4c6]">
              If this email has a Docmind password account, a verification code has been sent. Check your inbox and spam folder. Google and GitHub accounts should sign in with their provider instead.
            </p>
            <Link href={`/reset-password?email=${encodeURIComponent(email.trim().toLowerCase())}`} className="block w-full rounded-lg bg-[#e3f24a] px-4 py-3 text-center font-semibold text-[#1a1c04]">I have my verification code</Link>
            <button type="button" onClick={() => setSent(false)} className="w-full text-sm text-[#e3f24a] hover:underline">Use a different email</button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-7 space-y-5">
            <label className="block text-sm font-medium" htmlFor="email">Email address</label>
            <input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="w-full rounded-lg border border-[#454536] bg-[#121210] px-3 py-3 text-[#f6f5ec] outline-none focus:border-[#e3f24a]" />
            {error && <p role="alert" className="text-sm text-[#ff9c8f]">{error}</p>}
            <button disabled={!email.trim() || submitting} className="w-full rounded-lg bg-[#e3f24a] px-4 py-3 font-semibold text-[#1a1c04] disabled:cursor-not-allowed disabled:opacity-50">
              {submitting ? "Sending code…" : "Send verification code"}
            </button>
          </form>
        )}
        <Link href="/auth/login" className="mt-6 block text-center text-sm text-[#e3f24a] hover:underline">Back to sign in</Link>
      </section>
    </main>
  );
}
