"use client";

import { create } from "zustand";

/**
 * useLoginStore — Zustand store backing the Docmind sign-in page.
 * Holds the email/password form fields, password visibility, "remember
 * me", submission and error state, plus the submit action. The page
 * component only renders and wires up event handlers.
 */

interface LoginState {
  email: string;
  password: string;
  showPassword: boolean;
  remember: boolean;
  submitting: boolean;
  error: string;

  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  toggleShowPassword: () => void;
  setRemember: (value: boolean) => void;

  canSubmit: () => boolean;
  submit: (onSuccess: () => void) => void;
}

export const useLoginStore = create<LoginState>((set, get) => ({
  email: "",
  password: "",
  showPassword: false,
  remember: true,
  submitting: false,
  error: "",

  setEmail: (value) => set({ email: value, error: "" }),
  setPassword: (value) => set({ password: value, error: "" }),
  toggleShowPassword: () => set((state) => ({ showPassword: !state.showPassword })),
  setRemember: (value) => set({ remember: value }),

  canSubmit: () => {
    const { email, password } = get();
    return email.trim().length > 3 && password.length >= 6;
  },

  submit: (onSuccess) => {
    const { submitting } = get();
    if (!get().canSubmit() || submitting) return;

    set({ error: "", submitting: true });

    // Hook this up to your auth call, e.g.:
    // const { email, password, remember } = get();
    // await signIn({ email, password, remember })
    setTimeout(() => {
      set({ submitting: false });
      onSuccess();
    }, 900);
  },
}));