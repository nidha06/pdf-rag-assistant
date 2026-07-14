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
  content: ReactNode;
};

export type Attachment = {
  id: string;
  name: string;
  size: string;
};

export type DocumentItem = {
  name: string;
  meta: string;
  kind: "pdf" | "docx" | "txt";
};

export type ConversationItem = {
  name: string;
  meta: string;
  active: boolean;
};

export function FileIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
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

const initialMessages: Message[] = [
  {
    id: "m1",
    role: "ai",
    time: "9:41 AM",
    content: (
      <p>
        Hi Maren, I&apos;ve finished reading through{" "}
        <strong>Q3-marketing-plan.pdf</strong>. Want a summary, or should I
        jump straight to answering questions about it?
      </p>
    ),
  },
  {
    id: "m2",
    role: "user",
    time: "9:42 AM",
    content: (
      <p>
        Give me a summary, then pull out the projected budget by channel.
      </p>
    ),
  },
  {
    id: "m3",
    role: "ai",
    time: "9:42 AM",
    content: (
      <>
        <p>
          Here&apos;s the short version: the plan targets a 22% lift in
          qualified leads through paid social, lifecycle email, and a
          revamped partner program. Timeline runs Sept through Dec.
        </p>
        <p>Projected budget by channel:</p>
        <table>
          <tbody>
            <tr>
              <th>Channel</th>
              <th>Budget</th>
              <th>Share</th>
            </tr>
            <tr>
              <td>Paid social</td>
              <td>$182,000</td>
              <td>38%</td>
            </tr>
            <tr>
              <td>Lifecycle email</td>
              <td>$64,000</td>
              <td>13%</td>
            </tr>
            <tr>
              <td>Partner program</td>
              <td>$156,000</td>
              <td>32%</td>
            </tr>
            <tr>
              <td>Events</td>
              <td>$86,000</td>
              <td>17%</td>
            </tr>
          </tbody>
        </table>
        <div className="doc-chip-ref">
          <span className="file-ico">
            <FileIcon />
          </span>
          Q3-marketing-plan.pdf · p. 4–6
        </div>
      </>
    ),
  },
  {
    id: "m4",
    role: "user",
    time: "9:44 AM",
    content: (
      <p>Nice. Can you draft a short recap email for the team based on this?</p>
    ),
  },
];

export const documents: DocumentItem[] = [
  { name: "Q3-marketing-plan.pdf", meta: "2.4 MB · Added today", kind: "pdf" },
  { name: "Vendor-contract-v2.docx", meta: "640 KB · Yesterday", kind: "docx" },
  { name: "Meeting-notes.txt", meta: "12 KB · Mon", kind: "txt" },
];

export const conversations: ConversationItem[] = [
  { name: "Q3 marketing plan review", meta: "Active · 9:44 AM", active: true },
  { name: "Vendor contract redlines", meta: "Yesterday", active: false },
  { name: "Onboarding checklist draft", meta: "Mon", active: false },
];

interface DocmindState {
  messages: Message[];
  attachments: Attachment[];
  input: string;
  isTyping: boolean;
  dragOver: boolean;

  setInput: (value: string) => void;
  setDragOver: (value: boolean) => void;
  setIsTyping: (value: boolean) => void;

  sendMessage: () => void;
  submitUserMessage: () => string | null;
  appendAiMessage: (text: string) => void;
  addAttachment: (name: string, size: string) => void;
  removeAttachment: (id: string) => void;
}

export const useDocmindStore = create<DocmindState>((set, get) => ({
  messages: initialMessages,
  attachments: [{ id: "a1", name: "Q3-marketing-plan.pdf", size: "2.4 MB" }],
  input: "",
  isTyping: true,
  dragOver: false,

  setInput: (value) => set({ input: value }),
  setDragOver: (value) => set({ dragOver: value }),
  setIsTyping: (value) => set({ isTyping: value }),

  sendMessage: () => {
    const text = get().input.trim();
    if (!text) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      time: now(),
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
  submitUserMessage: () => {
    const text = get().input.trim();
    if (!text) return null;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      time: now(),
      content: <p>{text}</p>,
    };

    set((state) => ({
      messages: [...state.messages, userMsg],
      input: "",
    }));

    return text;
  },

  appendAiMessage: (text) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: crypto.randomUUID(),
          role: "ai",
          time: now(),
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