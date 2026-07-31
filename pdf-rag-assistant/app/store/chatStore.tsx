"use client";

import { create } from "zustand";
import type { ReactNode } from "react";

/**
 * useDocmindStore — single Zustand store backing the Docmind chat page.
 * Holds messages, attachments, composer input, typing state, and drag state.
 * UI components subscribe via selectors; nothing here renders markup itself
 * except the small bits of JSX needed for seed message content / icons.
 */

export type Message = {
  id: string;
  role: "ai" | "user";
  time: string;
  text?: string;
  sources?: MessageSource[];
  attachedDocuments?: MessageDocumentAttachment[];
  content: ReactNode;
};

export type MessageSource = {
  id: string;
  fileName: string;
  pageNumber: number;
  score: number;
  excerpt: string;
};

export type Attachment = {
  id: string;
  name: string;
  size: string;
};

export type MessageDocumentAttachment = {
  id: string;
  name: string;
  onOpen?: () => void;
};

export function FileIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

const now = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const initialMessages: Message[] = [];

interface DocmindState {
  messages: Message[];
  attachments: Attachment[];
  input: string;
  isTyping: boolean;
  dragOver: boolean;

  setInput: (value: string) => void;
  setDragOver: (value: boolean) => void;
  setIsTyping: (value: boolean) => void;
  setMessages: (messages: Message[]) => void;
  removeDocumentAttachments: (documentId: string) => void;

  sendMessage: () => void;
  submitUserMessage: (
    attachedDocuments?: MessageDocumentAttachment[]
  ) => string | null;
  appendAiMessage: (text: string, sources?: MessageSource[]) => void;
  addAttachment: (name: string, size: string) => void;
  removeAttachment: (id: string) => void;
}

export const useDocmindStore = create<DocmindState>((set, get) => ({
  messages: initialMessages,
  attachments: [],
  input: "",
  isTyping: false,
  dragOver: false,

  setInput: (value) => set({ input: value }),
  setDragOver: (value) => set({ dragOver: value }),
  setIsTyping: (value) => set({ isTyping: value }),
  setMessages: (messages) => set({ messages, isTyping: false }),
  removeDocumentAttachments: (documentId) =>
    set((state) => ({
      messages: state.messages.map((message) => ({
        ...message,
        attachedDocuments: message.attachedDocuments?.filter(
          (document) => document.id !== documentId
        ),
      })),
    })),

  sendMessage: () => {
    const text = get().input.trim();
    if (!text) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      time: now(),
      text,
      content: <p>{text}</p>,
    };

    set((state) => ({
      messages: [...state.messages, userMsg],
      input: "",
      isTyping: true,
    }));

    setTimeout(() => {
      set((state) => ({
        isTyping: false,
        messages: [
          ...state.messages,
          {
            id: crypto.randomUUID(),
            role: "ai",
            time: now(),
            text: "Got it — looking into that against your uploaded documents now.",
            content: (
              <p>
                Got it — looking into that against your uploaded documents
                now.
              </p>
            ),
          },
        ],
      }));
    }, 900);
  },

  // Optimistically pushes the composer text as a user message, clears
  // the input, and returns the trimmed text (or null if empty) so the
  // caller can kick off the React Query mutation with it.
  submitUserMessage: (attachedDocuments = []) => {
    const text = get().input.trim();
    if (!text) return null;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      time: now(),
      text,
      attachedDocuments,
      content: <p>{text}</p>,
    };

    set((state) => ({
      messages: [...state.messages, userMsg],
      input: "",
    }));

    return text;
  },

  appendAiMessage: (text, sources = []) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: crypto.randomUUID(),
          role: "ai",
          time: now(),
          text,
          sources,
          content: <p>{text}</p>,
        },
      ],
    })),

  addAttachment: (name, size) =>
    set((state) => ({
      attachments: [
        ...state.attachments,
        { id: crypto.randomUUID(), name, size },
      ],
    })),

  removeAttachment: (id) =>
    set((state) => ({
      attachments: state.attachments.filter((a) => a.id !== id),
    })),
}));
