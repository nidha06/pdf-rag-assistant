"use client";

import { useMutation } from "@tanstack/react-query";

/**
 * useAuthMutations — the network side of sign-in / sign-up.
 *
 * The Zustand auth store (store/authStore.tsx) still owns the form
 * fields (email, password, name, checkboxes, etc.) since that's local
 * UI state. These hooks own the actual request: pending/error state
 * comes from React Query instead of the store, and pages read
 * `mutation.isPending` / `mutation.error` in place of the store's old
 * `submitting` / `error` fields.
 */

type LoginPayload = {
  email: string;
  password: string;
  remember: boolean;
};

type SignupPayload = {
  name: string;
  email: string;
  password: string;
};

async function loginRequest(payload: LoginPayload) {
  // Replace with your real endpoint, e.g.:
  // const res = await fetch("/api/auth/login", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(payload),
  // });
  // if (!res.ok) {
  //   const body = await res.json().catch(() => null);
  //   throw new Error(body?.message ?? "Invalid email or password.");
  // }
  // return res.json();
  await new Promise((resolve) => setTimeout(resolve, 900));
  return { ok: true };
}

async function signupRequest(payload: SignupPayload) {
  // Replace with your real endpoint, e.g.:
  // const res = await fetch("/api/auth/signup", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(payload),
  // });
  // if (!res.ok) {
  //   const body = await res.json().catch(() => null);
  //   throw new Error(body?.message ?? "Could not create your account.");
  // }
  // return res.json();
  await new Promise((resolve) => setTimeout(resolve, 900));
  return { ok: true };
}

export function useLoginMutation() {
  return useMutation({
    mutationFn: loginRequest,
  });
}

export function useSignupMutation() {
  return useMutation({
    mutationFn: signupRequest,
  });
}