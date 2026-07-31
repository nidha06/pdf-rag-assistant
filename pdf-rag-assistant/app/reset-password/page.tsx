"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const RESEND_SECONDS = 60;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email")?.trim().toLowerCase() ?? "";
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("Enter the six-digit code from your email.");
  const [submitting, setSubmitting] = useState(false);
  const [resendAt, setResendAt] = useState(Date.now() + RESEND_SECONDS * 1000);
  const [now, setNow] = useState(Date.now());
  const resendSeconds = Math.max(0, Math.ceil((resendAt - now) / 1000));

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  async function readResponse(response: Response) {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message ?? "Something went wrong. Please try again.");
    return data;
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault();
    if (submitting || resetToken) return;
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/verify-reset-otp", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, otp }),
      });
      const data = await readResponse(response);
      setResetToken(data.resetToken);
      setNotice("Code confirmed. Choose your new password.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to verify that code.");
    } finally {
      setSubmitting(false);
    }
  }

  async function resetPassword(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    if (password !== confirmPassword) return setError("Passwords do not match.");
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, resetToken }),
      });
      const data = await readResponse(response);
      router.replace("/auth/login?reset=success");
      setNotice(data.message);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to reset your password.");
    } finally {
      setSubmitting(false);
    }
  }

  async function resendCode() {
    if (!email || resendSeconds > 0 || submitting) return;
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }),
      });
      await readResponse(response);
      setOtp("");
      setResetToken("");
      setNotice("A new code was requested. Check your inbox.");
      setResendAt(Date.now() + RESEND_SECONDS * 1000);
      setNow(Date.now());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to resend the code.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!email) {
    return <main className="grid min-h-screen place-items-center bg-[#121210] px-5 text-[#f6f5ec]"><Link href="/forgot-password" className="text-[#e3f24a] hover:underline">Request a new password-reset code</Link></main>;
  }

  return (
    <main className="min-h-screen bg-[#121210] px-5 py-16 text-[#f6f5ec]">
      <section className="mx-auto w-full max-w-md rounded-2xl border border-[#34342a] bg-[#1a1a13] p-8 shadow-2xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#e3f24a]">Docmind</p>
        <h1 className="text-3xl font-semibold">Verify and reset</h1>
        <p className="mt-3 text-sm leading-6 text-[#b9b9ab]">{notice}</p>
        {!resetToken ? (
          <form onSubmit={verifyCode} className="mt-7 space-y-5">
            <label className="block text-sm font-medium" htmlFor="otp">Verification code</label>
            <input id="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} placeholder="123456" className="w-full rounded-lg border border-[#454536] bg-[#121210] px-3 py-3 text-center text-xl tracking-[0.45em] text-[#f6f5ec] outline-none focus:border-[#e3f24a]" />
            {error && <p role="alert" className="text-sm text-[#ff9c8f]">{error}</p>}
            <button disabled={otp.length !== 6 || submitting} className="w-full rounded-lg bg-[#e3f24a] px-4 py-3 font-semibold text-[#1a1c04] disabled:cursor-not-allowed disabled:opacity-50">{submitting ? "Checking code…" : "Verify code"}</button>
          </form>
        ) : (
          <form onSubmit={resetPassword} className="mt-7 space-y-5">
            <label className="block text-sm font-medium" htmlFor="password">New password</label>
            <input id="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg border border-[#454536] bg-[#121210] px-3 py-3 text-[#f6f5ec] outline-none focus:border-[#e3f24a]" />
            <label className="block text-sm font-medium" htmlFor="confirm-password">Confirm new password</label>
            <input id="confirm-password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full rounded-lg border border-[#454536] bg-[#121210] px-3 py-3 text-[#f6f5ec] outline-none focus:border-[#e3f24a]" />
            {error && <p role="alert" className="text-sm text-[#ff9c8f]">{error}</p>}
            <button disabled={password.length < 8 || confirmPassword.length < 8 || submitting} className="w-full rounded-lg bg-[#e3f24a] px-4 py-3 font-semibold text-[#1a1c04] disabled:cursor-not-allowed disabled:opacity-50">{submitting ? "Updating password…" : "Update password"}</button>
          </form>
        )}
        {!resetToken && <button type="button" onClick={resendCode} disabled={resendSeconds > 0 || submitting} className="mt-6 w-full text-sm text-[#e3f24a] hover:underline disabled:cursor-not-allowed disabled:text-[#858577]">{resendSeconds > 0 ? `Resend available in ${resendSeconds}s` : "Resend verification code"}</button>}
        <Link href="/auth/login" className="mt-5 block text-center text-sm text-[#e3f24a] hover:underline">Back to sign in</Link>
      </section>
    </main>
  );
}
