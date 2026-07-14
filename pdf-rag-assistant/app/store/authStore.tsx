"use client";

import { create } from "zustand";

/**
 * useAuthStore — shared Zustand store backing both the Docmind
 * sign-in and sign-up pages. Keeps the two forms in separate,
 * clearly-namespaced slices (no shared field names) so each page's
 * state is independent, while living in one store the way a real
 * auth flow (e.g. carrying a prefilled email between screens) would
 * want. Each page component only renders and wires up event handlers.
 */

interface AuthState {
  // ----- Sign-in slice -----
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

  // ----- Sign-up slice -----
  signupName: string;
  signupEmail: string;
  signupPassword: string;
  signupConfirm: string;
  showSignupPassword: boolean;
  agree: boolean;
  signupSubmitting: boolean;
  signupError: string;

  setSignupName: (value: string) => void;
  setSignupEmail: (value: string) => void;
  setSignupPassword: (value: string) => void;
  setSignupConfirm: (value: string) => void;
  toggleShowSignupPassword: () => void;
  setAgree: (value: boolean) => void;

  passwordsMatch: () => boolean;
  canSubmitSignup: () => boolean;
  submitSignup: (onSuccess: () => void) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // ----- Sign-in slice -----
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

  // ----- Sign-up slice -----
  signupName: "",
  signupEmail: "",
  signupPassword: "",
  signupConfirm: "",
  showSignupPassword: false,
  agree: false,
  signupSubmitting: false,
  signupError: "",

  setSignupName: (value) => set({ signupName: value, signupError: "" }),
  setSignupEmail: (value) => set({ signupEmail: value, signupError: "" }),
  setSignupPassword: (value) => set({ signupPassword: value, signupError: "" }),
  setSignupConfirm: (value) => set({ signupConfirm: value, signupError: "" }),
  toggleShowSignupPassword: () =>
    set((state) => ({ showSignupPassword: !state.showSignupPassword })),
  setAgree: (value) => set({ agree: value }),

  passwordsMatch: () => {
    const { signupConfirm, signupPassword } = get();
    return signupConfirm.length === 0 || signupConfirm === signupPassword;
  },

  canSubmitSignup: () => {
    const { signupName, signupEmail, signupPassword, signupConfirm, agree } = get();
    return (
      signupName.trim().length > 1 &&
      signupEmail.trim().length > 3 &&
      signupPassword.length >= 6 &&
      signupConfirm === signupPassword &&
      agree
    );
  },

  submitSignup: (onSuccess) => {
    const { signupSubmitting } = get();
    if (!get().canSubmitSignup() || signupSubmitting) return;

    set({ signupError: "", signupSubmitting: true });

    // Hook this up to your auth call, e.g.:
    // const { signupName, signupEmail, signupPassword } = get();
    // await signUp({ name: signupName, email: signupEmail, password: signupPassword })
    setTimeout(() => {
      set({ signupSubmitting: false });
      onSuccess();
    }, 900);
  },
}));