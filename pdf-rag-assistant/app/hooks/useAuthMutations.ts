"use client";

import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { signIn } from "next-auth/react";

/**
 * useAuthMutations — the network side of sign-in / sign-up.
 *
 * The Zustand auth store (store/authStore.tsx) only owns the signed-in
 * `user`, not the login form fields — those live as local component
 * state on the login page. These hooks own the actual request:
 * pending/error state comes from React Query, and pages read
 * `mutation.isPending` / `mutation.error`.
 */

type LoginPayload = {
  email: string;
  password: string;
};

type SignupPayload = {
  name: string;
  email: string;
  password: string;
  otp: string;
};

type SendSignupOtpPayload = {
  email: string;
};

type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatarSeed: string;
  hasDocuments: boolean;
};

export const signinRequest = async (payload: LoginPayload): Promise<AuthUser> => {
  const result = await signIn("credentials", {
    ...payload,
    callbackUrl: "/chat",
    redirect: false,
  });

  if (!result?.ok) {
    throw new Error(
      "Email or password is incorrect. Social-auth accounts must use their connected provider."
    );
  }

  const response = await axios.get("/api/auth/me");
  if (!response.data) throw new Error("Unable to establish your session. Please try again.");
  return response.data;
};

// ── Signup OTP email verification ────────────────────────────────────

const sendSignupOtpRequest = async (payload: SendSignupOtpPayload): Promise<{ success: boolean }> => {
  const response = await axios.post("/api/auth/send-signup-otp", payload);
  return response.data;
};

export function useSendSignupOtpMutation() {
  return useMutation({
    mutationFn: sendSignupOtpRequest,
  });
}

// ── Signup (now requires OTP) ────────────────────────────────────────

export const signupRequest = async (payload: SignupPayload): Promise<AuthUser> => {
  try {
    await axios.post("/api/auth/signup", payload);
    return signinRequest({ email: payload.email, password: payload.password });
  } catch (error) {
    if (
      axios.isAxiosError(error) &&
      typeof error.response?.data?.message === "string"
    ) {
      throw new Error(error.response.data.message);
    }

    throw error;
  }
};

export function useSigninMutation() {
  return useMutation({
    mutationFn: signinRequest,
  });
}

export function useSignupMutation() {
  return useMutation({
    mutationFn: signupRequest,
  });
}
