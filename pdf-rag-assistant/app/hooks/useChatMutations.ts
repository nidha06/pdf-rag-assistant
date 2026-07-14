"use client";

import { useMutation } from "@tanstack/react-query";

/**
 * useSendMessageMutation — the network side of the chat send flow.
 *
 * The chat Zustand store (store/chatStore.tsx) still owns the message
 * list, attachments, composer input, and typing indicator. This hook
 * owns the actual request to the AI backend; the page calls
 * `mutate()` on send and appends the reply to the store's message
 * list in `onSuccess`.
 */

type SendMessagePayload = {
  text: string;
  attachmentIds: string[];
};

type SendMessageResult = {
  reply: string;
};

async function sendMessageRequest(
  payload: SendMessagePayload
): Promise<SendMessageResult> {
  // Replace with your real endpoint, e.g.:
  // const res = await fetch("/api/chat", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(payload),
  // });
  // if (!res.ok) throw new Error("Failed to get a response.");
  // return res.json();
  await new Promise((resolve) => setTimeout(resolve, 900));
  return {
    reply: "Got it — looking into that against your uploaded documents now.",
  };
}

export function useSendMessageMutation() {
  return useMutation({
    mutationFn: sendMessageRequest,
  });
}