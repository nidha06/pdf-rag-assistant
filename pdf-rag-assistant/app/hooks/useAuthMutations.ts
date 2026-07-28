"use client";

import { useMutation } from "@tanstack/react-query";
import axios from "axios";

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
};

type AuthUser = {
  id: string;
  name: string;
  email: string;
};

export const signinRequest = async (payload: LoginPayload): Promise<AuthUser> => {
  const response = await axios.post("/api/auth/login", payload);
  return response.data;
};

export const signupRequest = async (payload: SignupPayload): Promise<AuthUser> => {
  const response = await axios.post("/api/auth/signup", payload);
  return response.data;
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