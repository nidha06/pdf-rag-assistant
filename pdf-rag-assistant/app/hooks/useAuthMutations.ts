"use client";

import { useMutation } from "@tanstack/react-query";
import axios from "axios";

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
  email:string;
  password:string;
}

type SignupPayload = {
  name: string;
  email: string;
  password: string;
};

export const signinRequest = async(payload:LoginPayload)=>{
  // console.log("Reached - signin reqqq")
  const respones = await axios.post("/api/auth/login",payload);
  console.log("DATA:",respones.data)
  // return respones.data
}

export const signupRequest = async(payload:SignupPayload)=>{
  console.log("Reached to signup request")
  const respones = await axios.post("/api/auth/signup",payload);
  return respones.data
}

export function useSigninMutation(){
  console.log('Reached here - useSigninMutaiton')
  return useMutation({
    mutationFn: signinRequest,
  })
}

export function useSignupMutation(){
  return useMutation({
    mutationFn: signupRequest
  })
}

