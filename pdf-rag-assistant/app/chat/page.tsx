"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import ReactMarkdown from "react-markdown";
import { Avatar, Style } from "@dicebear/core";
import lorelei from "@dicebear/styles/lorelei.json";
import {
  useDocmindStore,
  FileIcon,
} from "../store/chatStore";

import {
  useDocuments,
  useUploadFilesMutation,
  useDeleteDocumentMutation,
} from "../hooks/useKnowledgeBaseMutations";
import { useCurrentUser } from "../hooks/useUserMutations";
import {
  useSendMessageMutation,
  useRegenerateMessageMutation,
  useChatHistory,
  type AnswerSource,
  type ChatHistoryMessage,
} from "../hooks/useChatMutations";
import { useRouteTransition } from "../route-transition";
import { AlienLogo, DocmindWordmark } from "../components/AlienLogo";


const doodleSvgTile = `
<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260' viewBox='0 0 260 260'>
  <g fill='none' stroke='rgba(227,242,74,0.07)' stroke-width='2.2' stroke-linecap='square' stroke-linejoin='miter'>
    <!-- bot face -->
    <rect x='18' y='22' width='34' height='26' rx='2'/>
    <rect x='26' y='31' width='5' height='5' fill='rgba(227,242,74,0.07)' stroke='none'/>
    <rect x='39' y='31' width='5' height='5' fill='rgba(227,242,74,0.07)' stroke='none'/>
    <line x1='35' y1='22' x2='35' y2='14'/>
    <rect x='32' y='9' width='6' height='6' fill='rgba(227,242,74,0.07)' stroke='none'/>
    <line x1='18' y1='40' x2='10' y2='40'/>
    <line x1='52' y1='40' x2='60' y2='40'/>

    <!-- sparkle -->
    <path d='M198 30 L201 41 L212 44 L201 47 L198 58 L195 47 L184 44 L195 41 Z' fill='rgba(227,242,74,0.06)' stroke='none'/>
    <path d='M222 62 L224 68 L230 70 L224 72 L222 78 L220 72 L214 70 L220 68 Z' fill='rgba(227,242,74,0.06)' stroke='none'/>

    <!-- chat bubble with typing dots -->
    <rect x='78' y='120' width='46' height='32' rx='6'/>
    <path d='M90 152 L90 160 L100 152 Z'/>
    <circle cx='90' cy='136' r='2' fill='rgba(227,242,74,0.08)' stroke='none'/>
    <circle cx='101' cy='136' r='2' fill='rgba(227,242,74,0.08)' stroke='none'/>
    <circle cx='112' cy='136' r='2' fill='rgba(227,242,74,0.08)' stroke='none'/>

    <!-- code brackets -->
    <path d='M182 130 L170 142 L182 154'/>
    <path d='M214 130 L226 142 L214 154'/>
    <line x1='196' y1='126' x2='200' y2='158'/>

    <!-- circuit nodes -->
    <circle cx='30' cy='200' r='4'/>
    <circle cx='58' cy='214' r='4'/>
    <circle cx='30' cy='230' r='4'/>
    <line x1='34' y1='200' x2='54' y2='212'/>
    <line x1='54' y1='216' x2='34' y2='228'/>
    <line x1='30' y1='204' x2='30' y2='226'/>

    <!-- small pixel dash trio -->
    <rect x='150' y='210' width='6' height='6' fill='rgba(227,242,74,0.06)' stroke='none'/>
    <rect x='162' y='210' width='6' height='6' fill='rgba(227,242,74,0.06)' stroke='none'/>
    <rect x='174' y='210' width='6' height='6' fill='rgba(227,242,74,0.06)' stroke='none'/>
  </g>
</svg>`;

const doodleBackground = `url("data:image/svg+xml,${encodeURIComponent(doodleSvgTile)}")`;
const loreleiStyle = new Style(lorelei);

/** How many documents to show in the sidebar before collapsing to "View all files". */
const SIDEBAR_DOC_LIMIT = 5;

/** "Maren Ruiz" -> "MR". Falls back to "?" when there's no name yet. */
function getInitials(name?: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function createUserAvatar(seed: string) {
  return new Avatar(loreleiStyle, { seed, size: 160 }).toDataUri();
}

/** Picks a sidebar file-icon color based on the document's extension. */
function getFileKind(name?: string | null) {
  const ext = (name?.split(".").pop() || "").toLowerCase();
  if (ext === "pdf") return "pdf";
  if (ext === "doc" || ext === "docx") return "docx";
  return "txt";
}

function formatBytes(bytes?: number | null) {
  if (bytes == null || Number.isNaN(bytes)) return "";
  const kb = bytes / 1024;
  return kb > 1024 ? (kb / 1024).toFixed(1) + " MB" : kb.toFixed(0) + " KB";
}

function TypingSpaceship() {
  const spaceshipRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    let frameId = 0;
    const startedAt = performance.now();

    const float = (now: number) => {
      const elapsed = now - startedAt;
      const offset = Math.sin((elapsed / 900) * Math.PI * 2) * 8;

      if (spaceshipRef.current) {
        spaceshipRef.current.style.transform = `translateY(${offset}px)`;
      }

      frameId = requestAnimationFrame(float);
    };

    frameId = requestAnimationFrame(float);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <svg
      ref={spaceshipRef}
      className="typing-spaceship"
      viewBox="0 0 72 40"
      fill="none"
      aria-hidden="true"
      style={{
        display: "block",
        width: 42,
        height: 24,
        flex: "0 0 42px",
        transformOrigin: "center",
        willChange: "transform",
      }}
    >
      <path d="M27 20c1-8 5-13 9-13s8 5 9 13H27Z" fill="var(--lime)" opacity=".55" />
      <path d="M13 22c6-5 14-7 23-7s17 2 23 7c-4 8-13 11-23 11S17 30 13 22Z" fill="var(--lime)" />
      <path d="M21 24h30" stroke="var(--lime-text)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="27" cy="27" r="2" fill="var(--lime-text)" />
      <circle cx="36" cy="29" r="2" fill="var(--lime-text)" />
      <circle cx="45" cy="27" r="2" fill="var(--lime-text)" />
    </svg>
  );
}

export default function DocmindPage() {
  const messages = useDocmindStore((s) => s.messages);
  const input = useDocmindStore((s) => s.input);
  const isTyping = useDocmindStore((s) => s.isTyping);
  const dragOver = useDocmindStore((s) => s.dragOver);
  //  const { data: document, isLoading, error } = useDocuments();
  const setInput = useDocmindStore((s) => s.setInput);
  const setDragOver = useDocmindStore((s) => s.setDragOver);
  const setIsTyping = useDocmindStore((s) => s.setIsTyping);
  const setMessages = useDocmindStore((s) => s.setMessages);
  const updateMessageText = useDocmindStore((s) => s.updateMessageText);
  const replaceMessageId = useDocmindStore((s) => s.replaceMessageId);
  const submitUserMessage = useDocmindStore((s) => s.submitUserMessage);
  const appendAiMessage = useDocmindStore((s) => s.appendAiMessage);
  const removeDocumentAttachments = useDocmindStore(
    (s) => s.removeDocumentAttachments
  );
  const removeMessagesAfter = useDocmindStore(
    (s) => s.removeMessagesAfter
  );

  const queryClient = useQueryClient();
  const sendMessageMutation = useSendMessageMutation();
  const regenerateMessageMutation = useRegenerateMessageMutation();
  const uploadFilesMutation = useUploadFilesMutation();
  const deleteDocumentMutation = useDeleteDocumentMutation();
  const isSending = sendMessageMutation.isPending;

  // NEW: which knowledge-base documents (from the sidebar) are selected to
  // scope the next question, and whether the "view all files" modal is open.
  // Purely additive local UI state — doesn't touch the Zustand store.
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [activeDocumentIds, setActiveDocumentIds] = useState<string[]>([]);
  const [showAllDocsModal, setShowAllDocsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [chatId, setChatId] = useState<string>();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [historyActionChatId, setHistoryActionChatId] = useState<string | null>(null);
  const [historyModal, setHistoryModal] = useState<{
    kind: "rename" | "delete";
    chat: { id: string; title: string };
  } | null>(null);
  const [conversationTitle, setConversationTitle] = useState("");
  const [conversationActionError, setConversationActionError] = useState("");
  const [isSavingConversationAction, setIsSavingConversationAction] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<any>(null);
  const [referenceSources, setReferenceSources] = useState<AnswerSource[] | null>(null);
  const [previewDocument, setPreviewDocument] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageText, setEditingMessageText] = useState("");
  const [savingMessageEditId, setSavingMessageEditId] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const startRouteTransition = useRouteTransition();

  const {
    data: documentsData,
    isLoading,
    error,
  } = useDocuments();
  const { data: chatHistory = [] } = useChatHistory();

  const allDocuments = Array.isArray(documentsData)
    ? documentsData
    : documentsData?.documents ?? [];

  // Only indexed documents can be searched. Failed or still-processing uploads
  // must not be selectable for document chat.
  const documents = allDocuments.filter(
    (document: any) => document.status === "READY"
  );

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredDocuments = normalizedSearch
    ? documents.filter((document: any) =>
      document.fileName.toLowerCase().includes(normalizedSearch)
    )
    : documents;
  const filteredChatHistory = normalizedSearch
    ? chatHistory.filter((chat) =>
      chat.title.toLowerCase().includes(normalizedSearch)
    )
    : chatHistory;
  const visibleSidebarDocs = filteredDocuments.slice(0, SIDEBAR_DOC_LIMIT);
  const hasMoreDocs = filteredDocuments.length > SIDEBAR_DOC_LIMIT;
  const selectedDocs = documents.filter((d: any) => selectedDocIds.includes(d.id));
  const documentContextCount =
    selectedDocIds.length > 0 ? selectedDocIds.length : activeDocumentIds.length;

  function toggleDocSelection(id: string) {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function startNewChat() {
    setChatId(undefined);
    setMessages([]);
    setSelectedDocIds([]);
    setActiveDocumentIds([]);
    setInput("");
    setHistoryActionChatId(null);
    if (window.matchMedia("(max-width: 980px)").matches) {
      setIsSidebarOpen(false);
    }
  }

  function confirmDocumentDelete() {
    if (!documentToDelete || deleteDocumentMutation.isPending) return;

    deleteDocumentMutation.mutate(documentToDelete.id, {
      onSuccess: () => {
        setSelectedDocIds((ids) =>
          ids.filter((id) => id !== documentToDelete.id)
        );
        setActiveDocumentIds((ids) =>
          ids.filter((id) => id !== documentToDelete.id)
        );
        removeDocumentAttachments(documentToDelete.id);
        setPreviewDocument((document) =>
          document?.id === documentToDelete.id ? null : document
        );
        setDocumentToDelete(null);
        queryClient.invalidateQueries({ queryKey: ["documents"] });
      },
      onError: (error) => {
        appendAiMessage(
          axios.isAxiosError(error) &&
            typeof error.response?.data?.message === "string"
            ? error.response.data.message
            : "Couldn't delete that document. Please try again."
        );
      },
    });
  }

  // Real current user, replacing the hardcoded "Maren Ruiz" profile card.
  const { data: user } = useCurrentUser();
  const userAvatar = useMemo(
    () => createUserAvatar(user?.avatarSeed ?? user?.id ?? user?.email ?? user?.name ?? "docmind-guest"),
    [user?.avatarSeed, user?.id, user?.email, user?.name]
  );

  function openProfileModal() {
    setDisplayName(user?.name ?? "");
    setShowProfileMenu(false);
    setShowProfileModal(true);
  }

  async function saveProfile() {
    if (!displayName.trim() || isSavingProfile) return;

    try {
      setIsSavingProfile(true);
      await axios.patch("/api/auth/me", { name: displayName });
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
      setShowProfileModal(false);
    } catch (error) {
      appendAiMessage(
        axios.isAxiosError(error) &&
          typeof error.response?.data?.message === "string"
          ? error.response.data.message
          : "Couldn't update your profile. Please try again."
      );
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function logout() {
    await signOut({ redirect: false });
    queryClient.clear();
    startRouteTransition();
    router.replace("/auth/login");
  }

  //   if (isLoading) {
  //   return <div>Loading...</div>;
  // }
  function sendMessage() {
    const question = input.trim();

    if (!question || isSending) return;

    // Selection applies to this one question only. Keep the IDs for the API
    // request, but render the selected files with the outgoing user message.
    const documentIds =
      selectedDocIds.length > 0 ? [...selectedDocIds] : activeDocumentIds;
    const attachedDocuments = selectedDocs.map((document: any) => ({
      id: document.id,
      name: document.fileName,
      onOpen: () =>
        setPreviewDocument({ id: document.id, name: document.fileName }),
    }));

    // Send a small amount of recent history so Gemini can understand
    // follow-up questions in both general-chat and document-chat modes.
    const history: ChatHistoryMessage[] = messages
      .slice(-10)
      .filter((message): message is typeof message & { text: string } =>
        typeof message.text === "string"
      )
      .map((message) => ({
        role: message.role === "ai" ? "assistant" : "user",
        content: message.text,
      }));

    // Adds the user's message to Zustand and clears the composer.
    const pendingUserMessageId = submitUserMessage(attachedDocuments);
    // Composer Enter creates a new message and moves the conversation down.
    // Editing an existing message uses a separate handler and never adds a duplicate.
    scrollChatToBottom(true);
    setSelectedDocIds([]);
    setActiveDocumentIds(documentIds);

    setIsTyping(true);
    sendMessageMutation.mutate(
      {
        question,
        documentIds,
        history,
        chatId,
      },
      {
        onSuccess: (result) => {
          if (pendingUserMessageId) replaceMessageId(pendingUserMessageId, result.userMessageId);
          appendAiMessage(result.answer, result.sources);
          // The generated assistant message is persisted by the API as well.
          // Update its temporary client id so later message actions use it.
          setMessages((() => {
            const current = useDocmindStore.getState().messages;
            const last = current[current.length - 1];
            return last?.role === "ai"
              ? [...current.slice(0, -1), { ...last, id: result.assistantMessageId }]
              : current;
          })());
          setChatId(result.chatId);
          queryClient.invalidateQueries({ queryKey: ["chat-history"] });
        },
        onError: (error) => {
          const message =
            axios.isAxiosError(error) &&
              typeof error.response?.data?.message === "string"
              ? error.response.data.message
              : "Sorry, something went wrong reaching the model. Please try again.";

          appendAiMessage(
            message
          );
        },
        onSettled: () => {
          setIsTyping(false);
        },
      }
    );
  }

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  function scrollChatToBottom(smooth = false) {
    requestAnimationFrame(() => {
      const element = scrollRef.current;
      if (!element) return;
      element.scrollTo({
        top: element.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    });
  }

  useEffect(() => {
    const desktopMedia = window.matchMedia("(min-width: 981px)");
    const syncSidebarForViewport = () => setIsSidebarOpen(desktopMedia.matches);

    syncSidebarForViewport();
    desktopMedia.addEventListener("change", syncSidebarForViewport);
    return () => desktopMedia.removeEventListener("change", syncSidebarForViewport);
  }, []);

  useEffect(() => {
    scrollChatToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [input]);

  // Close the "all files" modal with Escape, like any modal should.
  useEffect(() => {
    if (!showAllDocsModal) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setShowAllDocsModal(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showAllDocsModal]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      sendMessage();
    }
  }

  function uploadPdfFiles(files: File[]) {
    if (!files.length) return;

    const pdfFiles = files.filter(
      (file) =>
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf")
    );

    if (pdfFiles.length !== files.length) {
      appendAiMessage("Only PDF files can be uploaded.");
    }

    if (!pdfFiles.length) return;

    // Upload first; successful uploads are selected for the next message.
    uploadFilesMutation.mutate(
      { files: pdfFiles },
      {
        onSuccess: (uploadedDocuments) => {
          const uploadedIds = Array.isArray(uploadedDocuments)
            ? uploadedDocuments
              .map((document) => document?.id)
              .filter((id): id is string => typeof id === "string")
            : [];

          if (uploadedIds.length > 0) {
            setSelectedDocIds((currentIds) =>
              Array.from(new Set([...currentIds, ...uploadedIds]))
            );
          }

          queryClient.invalidateQueries({ queryKey: ["documents"] });
        },
        onError: () => {
          appendAiMessage(
            "One of your files didn't upload. Please try dropping it again."
          );
        },
      }
    );
  }

  async function copyMessage(messageId: string, text?: string) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      window.setTimeout(() => setCopiedMessageId((id) => id === messageId ? null : id), 1800);
    } catch {
      setCopiedMessageId(null);
    }
  }

  function beginMessageEdit(messageId: string, text?: string) {
    setEditingMessageId(messageId);
    setEditingMessageText(text ?? "");
  }

  async function saveMessageEdit(messageId: string) {
    if (savingMessageEditId) return;
    const content = editingMessageText.trim();
    if (!content) return;
    const previous = messages.find((message) => message.id === messageId)?.text;
    setSavingMessageEditId(messageId);
    updateMessageText(messageId, content);
    setEditingMessageId(null);
    scrollChatToBottom(true);

    // For unsaved chats (no chatId yet), just update the local text.
    if (!chatId) {
      setSavingMessageEditId(null);
      return;
    }

    // Optimistically remove the old AI response and show typing indicator.
    removeMessagesAfter(messageId);
    setIsTyping(true);
    scrollChatToBottom(true);

    regenerateMessageMutation.mutate(
      { chatId, messageId, content },
      {
        onSuccess: (result) => {
          appendAiMessage(result.answer, result.sources);
          // Replace the temporary client id with the persisted one.
          setMessages((() => {
            const current = useDocmindStore.getState().messages;
            const last = current[current.length - 1];
            return last?.role === "ai"
              ? [...current.slice(0, -1), { ...last, id: result.assistantMessageId }]
              : current;
          })());
          scrollChatToBottom(true);
        },
        onError: () => {
          if (previous) updateMessageText(messageId, previous);
          appendAiMessage(
            "Sorry, something went wrong regenerating the response. Please try again."
          );
        },
        onSettled: () => {
          setSavingMessageEditId(null);
          setIsTyping(false);
        },
      }
    );
  }

  async function openChat(selectedChatId: string) {
    try {
      const response = await axios.get(`/api/chats/${selectedChatId}`);
      const savedMessages = response.data.messages.map((message: {
        id: string;
        role: string;
        content: string;
        createdAt: string;
      }) => ({
        id: message.id,
        role: message.role === "assistant" ? "ai" : "user" as const,
        text: message.content,
        content: <p>{message.content}</p>,
        time: new Date(message.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));

      setMessages(savedMessages);
      setChatId(selectedChatId);
      setSelectedDocIds([]);
      setActiveDocumentIds(
        Array.isArray(response.data.documentIds) ? response.data.documentIds : []
      );
      setHistoryActionChatId(null);
      if (window.matchMedia("(max-width: 980px)").matches) {
        setIsSidebarOpen(false);
      }
    } catch {
      appendAiMessage("I couldn't load that conversation. Please try again.");
    }
  }

  function openHistoryModal(
    kind: "rename" | "delete",
    chat: { id: string; title: string }
  ) {
    setHistoryActionChatId(null);
    setConversationTitle(chat.title);
    setConversationActionError("");
    setHistoryModal({ kind, chat });
  }

  function closeHistoryModal() {
    if (isSavingConversationAction) return;
    setHistoryModal(null);
    setConversationActionError("");
  }

  async function saveConversationName(event: React.FormEvent) {
    event.preventDefault();
    if (!historyModal || isSavingConversationAction) return;

    const title = conversationTitle.trim();
    if (!title) {
      setConversationActionError("Give it a name first — even chats need an identity.");
      return;
    }

    try {
      setIsSavingConversationAction(true);
      await axios.patch(`/api/chats/${historyModal.chat.id}`, { title });
      queryClient.invalidateQueries({ queryKey: ["chat-history"] });
      setHistoryModal(null);
    } catch (error) {
      setConversationActionError(
        axios.isAxiosError(error) &&
          typeof error.response?.data?.message === "string"
          ? error.response.data.message
          : "That name slipped on a banana peel. Try again."
      );
    } finally {
      setIsSavingConversationAction(false);
    }
  }

  async function confirmChatDelete() {
    if (!historyModal || isSavingConversationAction) return;

    try {
      setIsSavingConversationAction(true);
      await axios.delete(`/api/chats/${historyModal.chat.id}`);
      if (chatId === historyModal.chat.id) startNewChat();
      queryClient.invalidateQueries({ queryKey: ["chat-history"] });
      setHistoryModal(null);
    } catch (error) {
      setConversationActionError(
        axios.isAxiosError(error) &&
          typeof error.response?.data?.message === "string"
          ? error.response.data.message
          : "The chat escaped the shredder. Please try again."
      );
    } finally {
      setIsSavingConversationAction(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    uploadPdfFiles(Array.from(e.dataTransfer.files || []));
  }

  function renderSelectableDocRow(document: any) {
    const isSelected = selectedDocIds.includes(document.id);
    return (
      <div
        className={`knowledge-doc-item ${isSelected ? "is-selected" : ""}`}
        key={document.id}
        onClick={() => toggleDocSelection(document.id)}
        role="button"
        tabIndex={0}
        aria-pressed={isSelected}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleDocSelection(document.id);
          }
        }}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "9px 10px",
          border: "none",
          background: isSelected ? "rgba(227, 242, 74, 0.1)" : "transparent",
          color: "inherit",
          textAlign: "left",
          cursor: "pointer",
        }}
      >
        <span
          className="knowledge-doc-icon"
          aria-hidden="true"
          style={{ width: 12, height: 12, minWidth: 12, display: "grid", placeItems: "center", color: isSelected ? "var(--lime)" : "var(--text-muted)" }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12, display: "block" }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
          </svg>
        </span>

        <span className="knowledge-doc-copy" style={{ minWidth: 0, flex: 1, display: "block" }}>
          <span className="knowledge-doc-name" style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12, fontWeight: 500, color: isSelected ? "var(--lime)" : "var(--text-primary)" }}>{document.fileName}</span>
          <span className="knowledge-doc-meta" style={{ display: "block", marginTop: 2, fontSize: 10.5, color: "var(--text-muted)" }}>
            Ready{document.fileSize ? ` · ${formatBytes(document.fileSize)}` : ""}
          </span>
        </span>
        <button
          type="button"
          aria-label={`Delete ${document.fileName}`}
          onClick={(e) => {
            e.stopPropagation();
            setDocumentToDelete(document);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              setDocumentToDelete(document);
            }
          }}
          style={{ border: 0, background: "transparent", color: "var(--text-muted)", fontSize: 17, lineHeight: 1, padding: "2px 4px", cursor: "pointer" }}
        >
          ×
        </button>
      </div>
    );
  }


  return (
    <div className="app">
      {/* ===== Header ===== */}
      <header>
        <div className="brand">
          <div className="brand-mark">
            <AlienLogo />
          </div>
          <DocmindWordmark />
        </div>

        <div className="header-search">
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            aria-label="Search documents and conversations"
            placeholder="Find that PDF before it plays hide-and-seek…"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="icon-btn sidebar-toggle"
            aria-label={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
            aria-expanded={isSidebarOpen}
            onClick={() => setIsSidebarOpen((isOpen) => !isOpen)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 7h16" />
              <path d="M4 12h16" />
              <path d="M4 17h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* ===== Main ===== */}
      <div className={`main ${isSidebarOpen ? "sidebar-is-open" : "sidebar-is-hidden"}`}>
        {isSidebarOpen && (
          <button
            type="button"
            className="sidebar-scrim"
            aria-label="Close sidebar"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        {/* Chat column */}
        <div className="chat-col">
          <div
            className="chat-scroll"
            ref={scrollRef}
            style={{ backgroundImage: doodleBackground }}
          >
            <div className="chat-inner">
              <div className="day-divider">Today</div>

              {messages.length === 0 && !isTyping && (
                <div className="welcome-title pixel">
                  Welcome, {user?.name ?? "friend"} — let&apos;s politely
                  interrogate some PDFs.
                </div>
              )}

              {messages.map((m) => (
                <div className={`msg ${m.role}`} key={m.id}>
                  <div className={`msg-avatar ${m.role === "ai" ? "pixel" : ""}`}>
                    {m.role === "ai" ? <AlienLogo className="chat-ai-logo" /> : <img src={userAvatar} alt="" />}
                  </div>
                  <div className="bubble-wrap">
                    <div className={`bubble ${m.role === "ai" ? "markdown-answer" : ""}`}>
                      {m.role === "ai" && m.text ? (
                        <ReactMarkdown>{m.text}</ReactMarkdown>
                      ) : editingMessageId === m.id ? (
                        <textarea
                          className="message-edit-input"
                          value={editingMessageText}
                          onChange={(event) => setEditingMessageText(event.target.value)}
                          disabled={savingMessageEditId === m.id}
                          onKeyDown={(event) => {
                            if (event.key === "Escape") setEditingMessageId(null);
                            if (
                              event.key === "Enter" &&
                              !event.shiftKey &&
                              !event.nativeEvent.isComposing
                            ) {
                              event.preventDefault();
                              void saveMessageEdit(m.id);
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <>
                          {m.content}
                          {m.attachedDocuments?.map((document) => (
                            <a
                              className="doc-chip-ref"
                              key={document.id}
                              href={`/api/documents/${document.id}/view`}
                              target="_blank"
                              rel="noreferrer"
                              title={`Open ${document.name}`}
                              onClick={(event) => {
                                if (document.onOpen) {
                                  event.preventDefault();
                                  document.onOpen();
                                }
                              }}
                            >
                              <span className="file-ico"><FileIcon /></span>
                              <span>{document.name}</span>
                            </a>
                          ))}
                        </>
                      )}
                    </div>
                    <div className="message-actions" aria-label="Message actions">
                      {m.role === "user" && (editingMessageId === m.id ? (
                        <>
                          <button
                            type="button"
                            disabled={savingMessageEditId === m.id}
                            onClick={() => void saveMessageEdit(m.id)}
                          >
                            {savingMessageEditId === m.id ? "Regenerating…" : (chatId ? "Save & Regenerate" : "Save")}
                          </button>
                          <button
                            type="button"
                            disabled={savingMessageEditId === m.id}
                            onClick={() => setEditingMessageId(null)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button type="button" onClick={() => beginMessageEdit(m.id, m.text)}>Edit</button>
                      ))}
                      <button type="button" onClick={() => void copyMessage(m.id, m.text)}>{copiedMessageId === m.id ? "Copied" : "Copy"}</button>
                    </div>
                    {m.role === "ai" && m.sources && m.sources.length > 0 && (
                      <div className="answer-sources" aria-label="Answer references">
                        <button type="button" onClick={() => setReferenceSources(m.sources ?? [])}>
                          View PDF source{m.sources.length === 1 ? "" : "s"} ({m.sources.length})
                        </button>
                      </div>
                    )}
                    <span className="msg-time">{m.time}</span>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div
                  className="msg ai typing-message"
                  role="status"
                  aria-label="Docmind is thinking"
                >
                  <div className="msg-avatar" aria-label="Docmind is responding">
                    <AlienLogo className="chat-ai-logo" />
                  </div>
                  <TypingSpaceship />
                </div>
              )}
            </div>
          </div>

          {/* Input area */}
          <div className="input-area">
            <div className="input-inner">
              {/* NEW: selected knowledge-base documents scoping the next question */}
              {selectedDocs.length > 0 && (
                <div className="selected-docs-bar">
                  {selectedDocs.map((document: any) => (
                    <div className="selected-doc-chip" key={document.id}>
                      <span className={`file-ico ${getFileKind(document.fileName)}`}>
                        <FileIcon />
                      </span>
                      <span className="selected-doc-name">{document.fileName}</span>
                      <button
                        type="button"
                        className="remove-selected-doc"
                        aria-label={`Remove ${document.fileName} from selection`}
                        onClick={() => toggleDocSelection(document.id)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 6 6 18" />
                          <path d="m6 6 12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="clear-selected-docs"
                    onClick={() => setSelectedDocIds([])}
                  >
                    Clear all
                  </button>
                </div>
              )}

              <div
                className={`composer ${dragOver ? "drag-over" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <textarea
                  ref={textareaRef}
                  rows={1}
                  placeholder={
                    documentContextCount > 0
                      ? "Ask a question about the selected documents"
                      : "Message Docmind AI"
                  }
                  value={input}
                  disabled={isSending}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <div className="composer-actions">
                  <button
                    type="button"
                    className="send-btn"
                    aria-label={isSending ? "Sending message" : "Send message"}
                    disabled={
                      isSending ||
                      !input.trim()
                    }
                    onClick={sendMessage}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m5 12 14-7-7 14-2-6z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="composer-hint">
                <span className="chat-mode">
                  {documentContextCount > 0
                    ? <>
                      Document chat · {documentContextCount} active
                      <button
                        type="button"
                        className="clear-document-context"
                        onClick={() => {
                          setSelectedDocIds([]);
                          setActiveDocumentIds([]);
                        }}
                      >
                        Ask generally
                      </button>
                    </>
                    : "General chat · select documents to ask about them"}
                </span>
                <span>
                  <kbd>Enter</kbd> to send · <kbd>Shift+Enter</kbd> for new line
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="sidebar" aria-hidden={!isSidebarOpen}>
          <button
            type="button"
            className="sidebar-close"
            aria-label="Close sidebar"
            onClick={() => setIsSidebarOpen(false)}
          >
            ×
          </button>
          <div className="profile-block">
            <button
              type="button"
              className="profile-card"
              onClick={() => setShowProfileMenu((isOpen) => !isOpen)}
              aria-expanded={showProfileMenu}
              aria-haspopup="menu"
            >
              <div className="avatar">
                <img src={userAvatar} alt="" />
                <span className="online-dot" />
              </div>
              <div className="profile-meta">
                <div className="profile-name">
                  {user?.name}
                </div>
                <div className="profile-email">
                  {user?.email}

                </div>
              </div>
            </button>
            {showProfileMenu && (
              <div className="profile-menu" role="menu">
                <button type="button" role="menuitem" onClick={openProfileModal}>
                  Profile
                </button>
                <button type="button" role="menuitem" className="logout-action" onClick={logout}>
                  Logout
                </button>
              </div>
            )}

          </div>
          <button type="button" className="new-chat-btn" onClick={startNewChat}>
            <span>+</span>
            Fresh start
          </button>
          <div className="knowledge-base-heading">
            <div className="sidebar-section-label">Knowledge Base</div>
            <input
              ref={uploadInputRef}
              type="file"
              accept="application/pdf,.pdf"
              multiple
              hidden
              onChange={(e) => {
                uploadPdfFiles(Array.from(e.target.files || []));
                e.target.value = "";
              }}
            />
            <button
              type="button"
              className="knowledge-upload-btn"
              aria-label="Upload PDF files"
              title="Upload PDF files"
              disabled={uploadFilesMutation.isPending}
              onClick={() => uploadInputRef.current?.click()}
            >
              {uploadFilesMutation.isPending ? "…" : "+"}
            </button>
          </div>

          <div className="knowledge-doc-list">
            {isLoading && (
              <div className="knowledge-doc-loading">
                <span className="spinner" />
                Updating library...
              </div>
            )}

            {!isLoading && (
              <div className="knowledge-doc-items">
                {filteredDocuments.length === 0 ? (
                  <div className="knowledge-doc-empty">
                    {normalizedSearch ? "No PDF matches that clue." : "No ready documents yet"}
                  </div>
                ) : (
                  visibleSidebarDocs.map((document: any) => renderSelectableDocRow(document))
                )}
              </div>
            )}

            {hasMoreDocs && (
              <button
                className="knowledge-view-all"
                onClick={() => setShowAllDocsModal(true)}
              >
                View all {filteredDocuments.length} documents
              </button>
            )}
          </div>

          <div>
            <div className="chat-history-heading">
              <div className="sidebar-section-label">Recent conversations</div>
            </div>
            <div className="sb-card">
              {filteredChatHistory.length === 0 ? (
                <p className="chat-history-empty">
                  {normalizedSearch ? "No chats match that clue." : "No conversations yet"}
                </p>
              ) : (
                filteredChatHistory.map((chat) => (
                  <div
                    className="sb-row history-row"
                    key={chat.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openChat(chat.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openChat(chat.id);
                      }
                    }}
                  >
                    <span className={`convo-dot ${chat.id === chatId ? "active" : ""}`} />
                    <div className="sb-row-text">
                      <div className="sb-row-title">{chat.title}</div>
                      <div className="sb-row-sub">
                        {new Date(chat.createAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="history-more-button"
                      aria-label={`Conversation options for ${chat.title}`}
                      aria-expanded={historyActionChatId === chat.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        setHistoryActionChatId((current) =>
                          current === chat.id ? null : chat.id
                        );
                      }}
                    >
                      ···
                    </button>
                    {historyActionChatId === chat.id && (
                      <div
                        className="history-action-menu"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <button type="button" onClick={() => openHistoryModal("rename", chat)}>
                          Rename
                        </button>
                        <button
                          type="button"
                          className="history-delete-button"
                          onClick={() => openHistoryModal("delete", chat)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>

      {referenceSources && (
        <div className="reference-modal-backdrop" onClick={() => setReferenceSources(null)}>
          <div
            className="reference-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reference-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="reference-modal-header">
              <div>
                <p>PDF RECEIPT</p>
                <h2 id="reference-modal-title">Source passages from the PDF</h2>
              </div>
              <button type="button" aria-label="Close reference" onClick={() => setReferenceSources(null)}>×</button>
            </div>
            <p className="reference-intro">Here are the original PDF passages Docmind used — no smoke, just receipts.</p>
            <div className="reference-sections">
              {referenceSources.map((source) => (
                <section className="reference-section" key={source.id}>
                  <div className="reference-meta">
                    <span>{source.fileName}</span>
                    <span>Page {source.pageNumber || "unknown"}</span>
                    <span>{Math.round(source.score * 100)}% match</span>
                  </div>
                  <blockquote>{source.excerpt}</blockquote>
                </section>
              ))}
            </div>
            <button type="button" className="reference-done" onClick={() => setReferenceSources(null)}>
              Got it
            </button>
          </div>
        </div>
      )}

      {previewDocument && (
        <div
          className="pdf-preview-backdrop"
          onClick={() => setPreviewDocument(null)}
        >
          <section
            className="pdf-preview-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pdf-preview-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="pdf-preview-header">
              <div>
                <p>PDF PREVIEW</p>
                <h2 id="pdf-preview-title">{previewDocument.name}</h2>
              </div>
              <button
                type="button"
                aria-label="Close PDF preview"
                onClick={() => setPreviewDocument(null)}
              >
                ×
              </button>
            </header>
            <iframe
              className="pdf-preview-frame"
              src={`/api/documents/${previewDocument.id}/view`}
              title={`Preview of ${previewDocument.name}`}
            />
          </section>
        </div>
      )}

      {historyModal && (
        <div className="conversation-modal-backdrop" onClick={closeHistoryModal}>
          <div
            className="conversation-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="conversation-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="conversation-modal-badge">
              {historyModal.kind === "rename" ? "✎" : "✦"}
            </div>
            {historyModal.kind === "rename" ? (
              <form onSubmit={saveConversationName}>
                <h2 id="conversation-modal-title">Give this chat a glow-up</h2>
                <p>A better title makes finding this brainy little detour easier.</p>
                <label className="conversation-name-label" htmlFor="conversation-name">
                  Conversation name
                </label>
                <input
                  id="conversation-name"
                  value={conversationTitle}
                  maxLength={100}
                  autoFocus
                  onFocus={(event) => event.currentTarget.select()}
                  onChange={(event) => setConversationTitle(event.target.value)}
                />
                {conversationActionError && (
                  <p className="conversation-action-error">{conversationActionError}</p>
                )}
                <div className="conversation-modal-actions">
                  <button type="button" onClick={closeHistoryModal}>Never mind</button>
                  <button type="submit" className="conversation-primary-button" disabled={isSavingConversationAction}>
                    {isSavingConversationAction ? "Saving…" : "Save name"}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <h2 id="conversation-modal-title">Send this chat to the void?</h2>
                <p>
                  <strong>{historyModal.chat.title}</strong> and its messages will
                  vanish. Poof. No take-backs.
                </p>
                {conversationActionError && (
                  <p className="conversation-action-error">{conversationActionError}</p>
                )}
                <div className="conversation-modal-actions">
                  <button type="button" onClick={closeHistoryModal}>Keep it</button>
                  <button
                    type="button"
                    className="conversation-primary-button"
                    disabled={isSavingConversationAction}
                    onClick={confirmChatDelete}
                  >
                    {isSavingConversationAction ? "Yeeting…" : "Yes, yeet it"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ===== "View all files" modal ===== */}
      {documentToDelete && (
        <div className="delete-modal-backdrop" onClick={() => setDocumentToDelete(null)}>
          <div
            className="delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-document-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="delete-modal-icon">!</div>
            <h2 id="delete-document-title">Send this PDF to the void?</h2>
            <p>
              <strong>{documentToDelete.fileName}</strong> will be permanently
              deleted—chunks, vectors, storage file, the whole paper trail.
            </p>
            <div className="delete-modal-actions">
              <button type="button" onClick={() => setDocumentToDelete(null)}>
                Keep it
              </button>
              <button
                type="button"
                className="delete-confirm-btn"
                disabled={deleteDocumentMutation.isPending}
                onClick={confirmDocumentDelete}
              >
                {deleteDocumentMutation.isPending ? "Deleting…" : "Yes, yeet it"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showProfileModal && (
        <div className="profile-modal-backdrop" onClick={() => setShowProfileModal(false)}>
          <div
            className="profile-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="profile-modal-header">
              <div>
                <p className="profile-kicker">IDENTITY FILE</p>
                <h2 id="edit-profile-title">Tune up your profile</h2>
              </div>
              <button type="button" aria-label="Close profile editor" onClick={() => setShowProfileModal(false)}>×</button>
            </div>
            <div className="profile-avatar-large">
              <img src={userAvatar} alt="Your generated DiceBear avatar" />
            </div>
            <label className="profile-field">
              <span>Display name</span>
              <input
                value={displayName}
                maxLength={80}
                autoFocus
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </label>
            <label className="profile-field">
              <span>Email</span>
              <input value={user?.email ?? ""} readOnly />
            </label>
            <p className="profile-help">Your PDFs will know who&apos;s in charge. Fancy.</p>
            <div className="profile-modal-actions">
              <button type="button" className="profile-cancel" onClick={() => setShowProfileModal(false)}>Cancel</button>
              <button type="button" className="profile-save" disabled={!displayName.trim() || isSavingProfile} onClick={saveProfile}>
                {isSavingProfile ? "Saving…" : "Lock it in"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAllDocsModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowAllDocsModal(false)}
        >
          <div
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            aria-label="All documents"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>All documents</h3>
              <button
                type="button"
                className="modal-close"
                aria-label="Close"
                onClick={() => setShowAllDocsModal(false)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              {filteredDocuments.length === 0 ? (
                <p className="modal-empty">
                  {normalizedSearch ? "No PDF matches that clue." : "No documents uploaded"}
                </p>
              ) : (
                filteredDocuments.map((document: any) => renderSelectableDocRow(document))
              )}
            </div>

            <div className="modal-footer">
              <span className="modal-footer-count">
                {selectedDocIds.length > 0
                  ? `${selectedDocIds.length} selected`
                  : "None selected"}
              </span>
              <button
                type="button"
                className="modal-done-btn"
                onClick={() => setShowAllDocsModal(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap");

        :root {
          --lime: #e3f24a;
          --lime-strong: #f0ff5c;
          --lime-dim: #b9c93a;
          --lime-text: #1a1c04;

          --bg: #121210;
          --surface: #1a1a13;
          --surface-2: #222118;
          --surface-3: #2a291d;

          --border: #34331f;
          --border-strong: #47451f;

          --text-primary: #f6f5ec;
          --text-secondary: #b3b19c;
          --text-muted: #7c7a68;

          --radius-sm: 8px;
          --radius: 12px;
          --radius-lg: 18px;

          --sp-1: 8px;
          --sp-2: 16px;
          --sp-3: 24px;
          --sp-4: 32px;
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        html,
        body {
          height: 100%;
          background: var(--bg);
        }
        body {
          font-family: "Inter", -apple-system, sans-serif;
          color: var(--text-primary);
          -webkit-font-smoothing: antialiased;
          overflow: hidden;
        }
      `}</style>

      <style jsx>{`
        .pixel {
          font-family: "Press Start 2P", monospace;
          letter-spacing: 0.5px;
        }

        .app {
          display: flex;
          flex-direction: column;
          height: 100vh;
          height: 100dvh;
          width: 100vw;
          background: var(--bg);
        }

        header {
          height: 64px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 var(--sp-3);
          border-bottom: 1px solid var(--border);
          background: var(--surface);
          gap: 12px;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }
        .brand-mark {
          width: 32px;
          height: 32px;
          background: var(--lime);
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .brand-mark svg {
          width: 16px;
          height: 16px;
        }
        .brand-name {
          font-size: 13px;
          color: var(--lime);
        }

        .header-search {
          flex: 1;
          max-width: 420px;
          margin: 0 var(--sp-4);
          position: relative;
          min-width: 0;
        }
        .header-search input {
          width: 100%;
          height: 38px;
          border-radius: var(--radius);
          border: 1px solid var(--border);
          background: var(--surface-2);
          padding: 0 14px 0 38px;
          font-size: 14px;
          font-family: "Inter", sans-serif;
          color: var(--text-primary);
          outline: none;
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .header-search input::placeholder {
          color: var(--text-muted);
        }
        .header-search input:focus {
          background: var(--surface-3);
          border-color: var(--lime);
          box-shadow: 0 0 0 3px rgba(227, 242, 74, 0.16);
        }
        .header-search .icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          width: 16px;
          height: 16px;
        }

        /* Knowledge base: self-contained document list styling. */
        .knowledge-doc-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .knowledge-doc-items {
          border: 1px solid var(--border);
          border-radius: var(--radius);
          background: var(--surface);
        }
        .knowledge-doc-item {
          appearance: none;
          width: 100%;
          min-width: 0;
          display: grid;
          grid-template-columns: 8px minmax(0, 1fr);
          align-items: start;
          column-gap: 8px;
          padding: 10px 11px;
          border: 0;
          border-radius: 0;
          background: transparent;
          color: inherit;
          text-align: left;
          cursor: pointer;
          transition: background 150ms ease;
        }
        .knowledge-doc-item + .knowledge-doc-item {
          border-top: 1px solid var(--border);
        }
        .knowledge-doc-item:hover,
        .knowledge-doc-item:focus-visible {
          background: var(--surface-2);
          outline: none;
        }
        .knowledge-doc-item.is-selected {
          background: rgba(227, 242, 74, 0.1);
        }
        .knowledge-doc-icon {
          width: 8px;
          min-width: 8px;
          max-width: 8px;
          height: 8px;
          min-height: 8px;
          max-height: 8px;
          display: grid;
          place-items: center;
          overflow: hidden;
          margin-top: 2px;
          color: var(--text-muted);
        }
        .knowledge-doc-icon svg {
          width: 8px;
          height: 8px;
          min-width: 8px;
          min-height: 8px;
          max-width: 8px;
          max-height: 8px;
          display: block;
          flex: none;
        }
        .knowledge-doc-item.is-selected .knowledge-doc-icon {
          color: var(--lime);
        }
        .knowledge-doc-copy {
          display: block;
          min-width: 0;
          flex: 1;
        }
        .knowledge-doc-name {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: var(--text-primary);
          font-size: 12px;
          font-weight: 500;
          line-height: 1.3;
        }
        .knowledge-doc-meta {
          display: block;
          margin-top: 2px;
          color: var(--text-muted);
          font-size: 10.5px;
          line-height: 1.3;
        }
        .knowledge-doc-item.is-selected .knowledge-doc-name {
          color: var(--lime);
        }
        .knowledge-doc-empty,
        .knowledge-doc-loading {
          padding: 12px;
          color: var(--text-muted);
          font-size: 12px;
        }
        .knowledge-view-all {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 9px;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          background: transparent;
          color: var(--text-secondary);
          font-size: 12px;
          cursor: pointer;
        }
        .knowledge-view-all:hover {
          border-color: var(--lime-dim);
          color: var(--lime);
        }

        .spinner {
          width: 16px;
          height: 16px;
          display: inline-block;
          margin-right: 7px;
          border: 2px solid var(--border);
          border-top-color: var(--lime);
          border-radius: 50%;
          vertical-align: middle;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

          /* --- Redesigned Document List Section --- */

.doc-list-container {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.doc-rows-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.doc-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 6px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.15s ease;
}
.doc-row:hover {
  background: var(--surface-2);
}
.doc-row.selected {
  background: rgba(227, 242, 74, 0.08);
}

.doc-file-ico {
  width: 24px;
  height: 24px;
  min-width: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  background: var(--surface-3);
  color: var(--text-secondary);
  transition: background 0.15s ease, color 0.15s ease;
}
.doc-file-ico :global(svg) {
  width: 13px !important;
  height: 13px !important;
  display: block;
}
.doc-file-ico.pdf {
  background: rgba(227, 242, 74, 0.14);
  color: var(--lime);
}
.doc-file-ico.is-checked {
  background: var(--lime);
  color: var(--lime-text);
}

.doc-row-text {
  min-width: 0;
  flex: 1;
}
.doc-row-title {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.doc-row.selected .doc-row-title {
  color: var(--lime);
}

/* Checkbox redesign */
.doc-checkbox {
  width: 16px;
  height: 16px;
  border: 1.5px solid var(--border-strong);
  border-radius: 4px;
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.doc-checkbox.checked {
  background: var(--lime);
  border-color: var(--lime);
  color: var(--lime-text);
}

.doc-checkbox svg {
  width: 12px;
  height: 12px;
}

/* Icon Box enhancement */
.doc-file-ico {
  width: 34px;
  height: 34px;
  min-width: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  border: 1px solid var(--border);
  flex-shrink: 0;
  transition: inherit;
}

.doc-file-ico.pdf {
  color: #ff4d4d; /* Subtle red for PDFs */
  background: rgba(255, 77, 77, 0.05);
}

.doc-file-ico.docx {
  color: #4da6ff; /* Blue for docs */
  background: rgba(77, 166, 255, 0.05);
}

.doc-file-ico.txt {
  color: var(--text-secondary);
  background: var(--surface-2);
}

.doc-row.selected .doc-file-ico {
  background: var(--lime);
  color: var(--lime-text);
  border-color: var(--lime);
}

/* Text group */
.doc-row-text {
  flex: 1;
  min-width: 0;
}

.doc-row-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.2s ease;
}

.doc-row-sub {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* View All Button Redesign */
.view-all-action {
  width: 100%;
  margin-top: 8px;
  padding: 12px;
  background: linear-gradient(to right, var(--surface), var(--bg));
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s ease;
}

.view-all-action:hover {
  border-color: var(--lime-dim);
  background: var(--surface-2);
  color: var(--text-primary);
}

.stacked-icons {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 14px;
}

.stacked-icons span {
  height: 2px;
  background: currentColor;
  border-radius: 1px;
}

.stacked-icons span:nth-child(1) { width: 100%; opacity: 0.4; }
.stacked-icons span:nth-child(2) { width: 70%; opacity: 0.7; }
.stacked-icons span:nth-child(3) { width: 40%; opacity: 1; }

.view-all-text {
  flex: 1;
  text-align: left;
}

.view-all-text .title {
  display: block;
  font-size: 12px;
  font-weight: 600;
}

.view-all-text .sub {
  display: block;
  font-size: 10px;
  color: var(--text-muted);
}

.view-all-action svg {
  width: 16px;
  height: 16px;
  opacity: 0.5;
}

.doc-list-empty {
  padding: 30px 20px;
  text-align: center;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text-muted);
}

.doc-list-empty svg {
  width: 24px;
  height: 24px;
  margin: 0 auto 8px;
  opacity: 0.3;
}

.doc-list-empty p {
  font-size: 12px;
}

        .header-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }
        .icon-btn {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-sm);
          border: 1px solid transparent;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--text-secondary);
          position: relative;
          transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
        }
        .icon-btn:hover {
          background: var(--surface-2);
          border-color: var(--border);
          color: var(--lime);
        }
        .icon-btn svg {
          width: 18px;
          height: 18px;
        }
        .notif-dot {
          position: absolute;
          top: 7px;
          right: 7px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--lime);
          border: 1.5px solid var(--surface);
        }
          .doc-list-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 6px;
}
.doc-list-empty {
  padding: 12px 8px;
  font-size: 12.5px;
  color: var(--text-muted);
}

.doc-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 8px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.15s ease;
}
.doc-row:hover {
  background: var(--surface-2);
}
.doc-row + .doc-row {
  border-top: 1px solid var(--border);
  margin-top: 1px;
  padding-top: 10px;
}
.doc-row.selected {
  background: rgba(227, 242, 74, 0.08);
}

.doc-checkbox {
  width: 7px;
  height: 7px;
  border-radius: 5px;
  border: 1.5px solid var(--border-strong);
  background: var(--surface-2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--lime-text);
  transition: background 0.15s ease, border-color 0.15s ease;
}
.doc-checkbox.checked {
  background: var(--lime);
  border-color: var(--lime);
}
.doc-checkbox svg {
  width: 11px;
  height: 11px;
}

/* Fixed-size icon "box" — overflow hidden so the inner SVG can never blow the row up */
.doc-file-ico {
  width: 28px;
  height: 28px;
  min-width: 28px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}
.doc-file-ico :global(svg) {
  width: 14px !important;
  height: 14px !important;
  max-width: 14px;
  max-height: 14px;
  display: block;
}
.doc-file-ico.pdf {
  background: rgba(227, 242, 74, 0.14);
  color: var(--lime);
}
.doc-file-ico.docx,
.doc-file-ico.txt {
  background: var(--surface-3);
  color: var(--text-secondary);
}

.doc-row-text {
  min-width: 0;
  flex: 1;
}
.doc-row-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.doc-row-sub {
  font-size: 11.5px;
  color: var(--text-muted);
  margin-top: 1px;
}

.view-all-row {
  color: var(--text-secondary);
}
.view-all-ico {
  background: var(--surface-3);
  color: var(--lime);
  font-size: 10.5px;
  font-weight: 700;
}
.view-all-chevron {
  width: 14px;
  height: 14px;
  color: var(--text-muted);
  flex-shrink: 0;
}

        .main {
          flex: 1;
          display: flex;
          min-height: 0;
          overflow: hidden;
        }

        .chat-col {
          flex: 1 1 75%;
          display: flex;
          flex-direction: column;
          min-width: 0;
          border-right: 1px solid var(--border);
          min-height: 0;
        }

        .chat-scroll {
          flex: 1;
          overflow-y: auto;
          padding: var(--sp-4) 0;
          background-repeat: repeat;
          background-size: 260px 260px;
          background-attachment: fixed;
          background-color: var(--bg);
        }
        .chat-inner {
          max-width: 720px;
          margin: 0 auto;
          padding: 0 var(--sp-3);
          display: flex;
          flex-direction: column;
          gap: var(--sp-3);
        }

        .day-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--text-muted);
          font-size: 12px;
          margin: 8px 0 4px;
        }
        .day-divider::before,
        .day-divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: var(--border);
        }

        .welcome-title {
          min-height: 240px;
          display: grid;
          place-items: center;
          text-align: center;
          color: var(--lime);
          font-size: clamp(20px, 3vw, 32px);
          line-height: 1.55;
          padding: 24px;
        }

        .msg {
          display: flex;
          gap: 12px;
          max-width: 100%;
          animation: fadeIn 0.35s ease;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .msg.user {
          flex-direction: row-reverse;
        }
        .msg-avatar {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 600;
        }
        .msg.ai .msg-avatar {
          background: var(--lime);
          color: var(--lime-text);
          padding: 5px;
        }
        .chat-ai-logo {
          width: 100%;
          height: 100%;
          color: var(--lime-text);
        }
        .msg.user .msg-avatar {
          background: var(--surface-3);
          color: var(--text-secondary);
        }
        .msg-avatar img,
        .avatar img {
          width: 100%;
          height: 100%;
          display: block;
          border-radius: inherit;
          object-fit: cover;
        }

        .bubble-wrap {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-width: 78%;
        }
        .answer-sources {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 2px;
        }
        .answer-sources button {
          max-width: 100%;
          padding: 5px 7px;
          overflow: hidden;
          border: 1px solid var(--lime-dim);
          border-radius: 6px;
          background: rgba(227, 242, 74, 0.07);
          color: var(--lime);
          font: inherit;
          font-size: 10px;
          text-overflow: ellipsis;
          white-space: nowrap;
          cursor: pointer;
        }
        .answer-sources button:hover {
          background: rgba(227, 242, 74, 0.15);
        }
        .msg.user .bubble-wrap {
          align-items: flex-end;
        }

        .bubble {
          padding: 12px 16px;
          border-radius: var(--radius);
          font-size: 14.5px;
          line-height: 1.65;
        }
        .msg.ai .bubble {
          background: var(--surface);
          border: 1px solid var(--border);
          border-left: 2px solid var(--lime);
          color: var(--text-primary);
          border-top-left-radius: 4px;
        }
        .msg.user .bubble {
          background: var(--surface-2);
          color: var(--text-primary);
          border-top-right-radius: 4px;
        }
        .bubble :global(p + p) {
          margin-top: 10px;
        }
        .markdown-answer :global(h1),
        .markdown-answer :global(h2),
        .markdown-answer :global(h3) {
          margin: 14px 0 7px;
          color: var(--lime);
          font-weight: 650;
          line-height: 1.3;
        }
        .markdown-answer :global(h1) { font-size: 19px; }
        .markdown-answer :global(h2) { font-size: 17px; }
        .markdown-answer :global(h3) { font-size: 15px; }
        .markdown-answer :global(h1:first-child),
        .markdown-answer :global(h2:first-child),
        .markdown-answer :global(h3:first-child) {
          margin-top: 0;
        }
        .markdown-answer :global(ul),
        .markdown-answer :global(ol) {
          margin: 8px 0;
          padding-left: 20px;
        }
        .markdown-answer :global(li + li) {
          margin-top: 4px;
        }
        .markdown-answer :global(strong) {
          color: var(--lime);
          font-weight: 650;
        }
        .markdown-answer :global(blockquote) {
          margin: 10px 0;
          padding: 7px 11px;
          border-left: 2px solid var(--lime-dim);
          color: var(--text-secondary);
        }
        .markdown-answer :global(code) {
          padding: 2px 5px;
          border-radius: 4px;
          background: var(--surface-3);
          color: var(--lime);
          font-family: "JetBrains Mono", monospace;
          font-size: 0.88em;
        }
        .markdown-answer :global(pre) {
          margin: 10px 0;
          padding: 11px;
          overflow-x: auto;
          border: 1px solid var(--border);
          border-radius: 7px;
          background: var(--surface-2);
        }
        .markdown-answer :global(pre code) {
          padding: 0;
          background: transparent;
        }
        .bubble :global(table) {
          margin-top: 10px;
          border-collapse: collapse;
          width: 100%;
          font-size: 13px;
        }
        .bubble :global(th),
        .bubble :global(td) {
          border: 1px solid var(--border);
          padding: 6px 10px;
          text-align: left;
        }
        .bubble :global(th) {
          background: var(--surface-2);
          color: var(--lime);
          font-weight: 600;
        }

        .msg-time {
          font-size: 11px;
          color: var(--text-muted);
          padding: 0 4px;
        }

        .doc-chip-ref {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 5px 10px 5px 6px;
          font-size: 12.5px;
          margin-top: 8px;
          color: var(--text-secondary);
        }
        .doc-chip-ref .file-ico {
          width: 18px;
          height: 18px;
          border-radius: 4px;
          background: var(--lime);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--lime-text);
          flex-shrink: 0;
        }
        .doc-chip-ref .file-ico :global(svg) {
          width: 10px;
          height: 10px;
        }

        .typing-message {
          display: flex;
          align-items: center;
          gap: 10px;
          height: 30px;
        }
        .message-actions {
          display: flex;
          gap: 8px;
          padding: 0 4px;
          opacity: 0;
          transition: opacity 0.15s ease;
        }
        .bubble-wrap:hover .message-actions,
        .message-actions:focus-within {
          opacity: 1;
        }
        .message-actions button {
          border: 0;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          font: inherit;
          font-size: 11px;
        }
        .message-actions button:hover { color: var(--lime); }
        .message-edit-input {
          display: block;
          width: min(460px, 100%);
          min-height: 72px;
          resize: vertical;
          border: 1px solid var(--lime-dim);
          border-radius: 7px;
          background: var(--bg);
          color: var(--text-primary);
          font: inherit;
          line-height: inherit;
          outline: none;
          padding: 8px;
        }
        .typing-message .typing-spaceship {
          width: 42px;
          height: 24px;
          transform-origin: center;
          will-change: transform;
        }
        .typing-message .msg-avatar {
          align-self: center;
          align-items: center;
        }

        .input-area {
          flex-shrink: 0;
          padding: var(--sp-2) var(--sp-3) var(--sp-3);
          background: var(--bg);
        }
        .input-inner {
          max-width: 720px;
          margin: 0 auto;
        }

        /* NEW: chips for documents selected from the sidebar/modal, shown above the composer */
        .selected-docs-bar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        .selected-doc-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(227, 242, 74, 0.1);
          border: 1px solid var(--lime-dim);
          border-radius: var(--radius-sm);
          padding: 6px 8px 6px 8px;
          font-size: 12.5px;
          max-width: 100%;
        }
        .selected-doc-chip .file-ico {
          width: 22px;
          height: 22px;
          border-radius: 6px;
          background: rgba(227, 242, 74, 0.18);
          color: var(--lime);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .selected-doc-chip .file-ico :global(svg) {
          width: 12px;
          height: 12px;
        }
        .selected-doc-name {
          font-weight: 500;
          color: var(--text-primary);
          max-width: 160px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .remove-selected-doc {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          cursor: pointer;
          background: transparent;
          border: none;
          flex-shrink: 0;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .remove-selected-doc:hover {
          background: var(--surface-3);
          color: var(--lime);
        }
        .remove-selected-doc :global(svg) {
          width: 11px;
          height: 11px;
        }
        .clear-selected-docs {
          font-size: 11.5px;
          color: var(--text-muted);
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 2px;
          text-decoration: underline;
          text-underline-offset: 2px;
          flex-shrink: 0;
        }
        .clear-selected-docs:hover {
          color: var(--lime);
        }

        .attachments-preview {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 8px;
        }
        .attachment-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 6px 8px 6px 6px;
          font-size: 12.5px;
        }
        .attachment-chip .file-ico {
          width: 26px;
          height: 26px;
          border-radius: 6px;
          background: var(--surface-3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--lime);
          flex-shrink: 0;
        }
        .attachment-chip .file-ico :global(svg) {
          width: 14px;
          height: 14px;
        }
        .attachment-chip .file-meta {
          line-height: 1.3;
        }
        .attachment-chip .file-name {
          font-weight: 500;
          color: var(--text-primary);
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .attachment-chip .file-size {
          color: var(--text-muted);
          font-size: 11px;
        }
        .attachment-chip .remove-btn {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          cursor: pointer;
          background: transparent;
          border: none;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .attachment-chip .remove-btn:hover {
          background: var(--surface-3);
          color: var(--lime);
        }
        .attachment-chip .remove-btn :global(svg) {
          width: 12px;
          height: 12px;
        }

        .composer {
          background: var(--surface);
          border: 1px solid var(--border-strong);
          border-radius: var(--radius-lg);
          padding: 10px 10px 10px 16px;
          display: flex;
          align-items: flex-end;
          gap: 8px;
          transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
        }
        .composer.drag-over {
          border-color: var(--lime);
          box-shadow: 0 0 0 4px rgba(227, 242, 74, 0.14);
          background: var(--surface-2);
        }
        .composer:focus-within {
          border-color: var(--lime-dim);
        }
        .composer textarea {
          flex: 1;
          border: none;
          outline: none;
          resize: none;
          font-family: "Inter", sans-serif;
          font-size: 14.5px;
          line-height: 1.5;
          max-height: 160px;
          padding: 8px 0;
          color: var(--text-primary);
          background: transparent;
        }
        .composer textarea::placeholder {
          color: var(--text-muted);
        }
        .composer textarea:disabled {
          cursor: wait;
          opacity: 0.7;
        }

        .composer-actions {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .upload-btn {
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--surface-2);
          color: var(--text-secondary);
          cursor: pointer;
          transition: color 0.15s ease, border-color 0.15s ease;
        }
        .upload-btn:hover:not(:disabled) {
          color: var(--lime);
          border-color: var(--lime-dim);
        }
        .upload-btn:disabled {
          cursor: wait;
          opacity: 0.55;
        }
        .upload-btn svg {
          width: 16px;
          height: 16px;
        }

        .send-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: var(--lime);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--lime-text);
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.15s ease, transform 0.1s ease;
        }
        .send-btn:hover {
          background: var(--lime-strong);
        }
        .send-btn:active {
          transform: scale(0.94);
        }
        .send-btn svg {
          width: 16px;
          height: 16px;
        }
        .send-btn:disabled {
          background: var(--surface-3);
          color: var(--text-muted);
          cursor: default;
        }

        .composer-hint {
          display: flex;
          justify-content: space-between;
          font-size: 11.5px;
          color: var(--text-muted);
          margin-top: 8px;
          padding: 0 4px;
          gap: 8px;
        }
        .chat-mode {
          color: var(--text-secondary);
        }
        .clear-document-context {
          margin-left: 8px;
          padding: 2px 6px;
          border: 1px solid var(--lime-dim);
          border-radius: 999px;
          background: transparent;
          color: var(--lime);
          font: inherit;
          font-size: 10px;
          cursor: pointer;
        }
        .clear-document-context:hover {
          background: rgba(227, 242, 74, 0.1);
        }
        .composer-hint :global(kbd) {
          font-family: inherit;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 1px 5px;
          font-size: 10.5px;
          color: var(--text-secondary);
        }

        .sidebar {
          flex: 0 0 300px;
          background: var(--bg);
          overflow-y: auto;
          padding: var(--sp-3);
          display: flex;
          flex-direction: column;
          gap: var(--sp-3);
        }
        .main.sidebar-is-hidden .sidebar {
          display: none;
        }
        .main.sidebar-is-hidden .chat-col {
          border-right: none;
        }
        .sidebar-scrim,
        .sidebar-close {
          display: none;
        }

        .profile-block {
          background: var(--lime);
          border-radius: var(--radius);
          padding: 4px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          position: relative;
        }
        .profile-card {
          display: flex;
          width: 100%;
          align-items: center;
          gap: 12px;
          padding: 14px 12px;
          border: 0;
          border-radius: 8px;
          background: transparent;
          text-align: left;
          cursor: pointer;
        }
        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--lime-text);
          color: var(--lime);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 600;
          position: relative;
          flex-shrink: 0;
        }
        .online-dot {
          position: absolute;
          bottom: -1px;
          right: -1px;
          width: 11px;
          height: 11px;
          border-radius: 50%;
          background: var(--lime);
          border: 2px solid var(--lime-text);
        }
        .profile-meta {
          min-width: 0;
        }
        .profile-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--lime-text);
        }
        .profile-email {
          font-size: 12px;
          color: var(--lime-text);
          opacity: 0.65;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .profile-menu {
          position: absolute;
          z-index: 20;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          padding: 5px;
          border: 1px solid var(--border);
          border-radius: 9px;
          background: var(--surface-2);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
        }
        .profile-menu button {
          width: 100%;
          padding: 9px 10px;
          border: 0;
          border-radius: 6px;
          background: transparent;
          color: var(--text-primary);
          font: inherit;
          font-size: 12px;
          text-align: left;
          cursor: pointer;
        }
        .profile-menu button:hover {
          background: var(--surface-3);
        }
        .profile-menu .logout-action {
          color: #ff817d;
        }

        .profile-modal-backdrop {
          position: fixed;
          z-index: 100;
          inset: 0;
          display: grid;
          place-items: center;
          padding: 20px;
          background: rgba(0, 0, 0, 0.72);
        }
        .profile-modal {
          width: min(100%, 440px);
          padding: 20px;
          border: 1px solid var(--lime-dim);
          border-radius: 16px;
          background: #202016;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.65), 0 0 34px rgba(227, 242, 74, 0.08);
        }
        .profile-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .profile-modal-header h2 {
          margin-top: 3px;
          color: var(--lime);
          font-size: 18px;
          font-weight: 650;
        }
        .profile-kicker {
          color: var(--text-muted);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
        }
        .profile-modal-header button {
          width: 28px;
          height: 28px;
          border: 1px solid transparent;
          border-radius: 7px;
          background: var(--surface-2);
          color: var(--text-secondary);
          font-size: 21px;
          line-height: 1;
          cursor: pointer;
        }
        .profile-modal-header button:hover {
          border-color: var(--lime-dim);
          color: var(--lime);
        }
        .profile-avatar-large {
          width: 128px;
          height: 128px;
          overflow: hidden;
          margin: 22px auto 18px;
          border: 3px solid var(--lime);
          border-radius: 50%;
          background: var(--surface-2);
          box-shadow: 0 0 0 4px #202016, 0 0 0 5px var(--lime-dim);
        }
        .profile-avatar-large img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }
        .profile-field {
          display: block;
          margin-top: 10px;
          padding: 9px 11px;
          border: 1px solid var(--border);
          border-radius: 7px;
          background: var(--surface-2);
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .profile-field:focus-within {
          border-color: var(--lime);
          box-shadow: 0 0 0 3px rgba(227, 242, 74, 0.1);
        }
        .profile-field span {
          display: block;
          margin-bottom: 4px;
          color: var(--lime);
          font-size: 11px;
        }
        .profile-field input {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: var(--text-primary);
          font: inherit;
          font-size: 13px;
        }
        .profile-field input:read-only {
          color: var(--text-muted);
        }
        .profile-help {
          margin: 12px 0 16px;
          color: var(--text-muted);
          font-size: 11px;
          text-align: center;
        }
        .profile-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
        .profile-modal-actions button {
          padding: 8px 15px;
          border-radius: 999px;
          font: inherit;
          font-size: 12px;
          cursor: pointer;
        }
        .profile-cancel {
          border: 1px solid var(--lime-dim);
          background: transparent;
          color: var(--text-primary);
        }
        .profile-save {
          border: 1px solid var(--lime);
          background: var(--lime);
          color: var(--lime-text);
          font-weight: 600;
          box-shadow: 0 4px 14px rgba(227, 242, 74, 0.18);
        }
        .profile-save:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }
        .workspace-row {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--lime-text);
          border-radius: 9px;
          padding: 10px 12px;
        }
        .workspace-ico {
          width: 26px;
          height: 26px;
          border-radius: 6px;
          background: var(--lime);
          color: var(--lime-text);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .workspace-ico svg {
          width: 13px;
          height: 13px;
        }
        .workspace-name {
          font-size: 12.5px;
          font-weight: 500;
          color: var(--lime);
        }
        .workspace-sub {
          font-size: 11px;
          color: var(--text-muted);
        }

        .sidebar-section-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--text-muted);
          font-weight: 600;
          padding: 0 2px;
          margin-bottom: 6px;
        }
        .chat-history-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }
        .chat-history-heading .sidebar-section-label {
          margin-bottom: 0;
        }
        .new-chat-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 11px 14px;
          border: 1px solid var(--lime);
          border-radius: var(--radius);
          background: var(--lime);
          color: var(--lime-text);
          font: inherit;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 5px 18px rgba(227, 242, 74, 0.14);
          transition: transform 0.15s ease, background 0.15s ease;
        }
        .new-chat-btn:hover {
          background: var(--lime-strong);
          transform: translateY(-1px);
        }
        .new-chat-btn span {
          font-size: 20px;
          font-weight: 400;
          line-height: 0.7;
        }

        .reference-modal-backdrop,
        .conversation-modal-backdrop,
        .delete-modal-backdrop,
        .pdf-preview-backdrop {
          position: fixed;
          z-index: 110;
          inset: 0;
          display: grid;
          place-items: center;
          padding: 20px;
          background: rgba(0, 0, 0, 0.66);
        }
        .pdf-preview-modal {
          width: min(960px, calc(100vw - 32px));
          height: min(760px, calc(100vh - 40px));
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid var(--lime-dim);
          border-radius: 14px;
          background: var(--surface-1);
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.62);
        }
        .pdf-preview-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 14px 16px;
          border-bottom: 1px solid var(--border);
          background: var(--surface-2);
        }
        .pdf-preview-header p {
          margin: 0 0 3px;
          color: var(--lime);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
        }
        .pdf-preview-header h2 {
          max-width: min(760px, 70vw);
          margin: 0;
          overflow: hidden;
          color: var(--text-primary);
          font-size: 14px;
          font-weight: 600;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .pdf-preview-header button {
          width: 30px;
          height: 30px;
          flex: 0 0 auto;
          border: 1px solid var(--border);
          border-radius: 7px;
          background: transparent;
          color: var(--text-secondary);
          font-size: 21px;
          line-height: 1;
          cursor: pointer;
        }
        .pdf-preview-header button:hover {
          border-color: var(--lime);
          color: var(--lime);
        }
        .pdf-preview-frame {
          width: 100%;
          min-height: 0;
          flex: 1;
          border: 0;
          background: #fff;
        }
        .reference-modal {
          width: min(100%, 540px);
          max-height: min(80vh, 620px);
          display: flex;
          flex-direction: column;
          padding: 20px;
          border: 1px solid var(--lime-dim);
          border-radius: 16px;
          background: #202016;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.65), 0 0 34px rgba(227, 242, 74, 0.08);
        }
        .reference-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }
        .reference-modal-header p {
          color: var(--text-muted);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
        }
        .reference-modal-header h2 {
          margin-top: 4px;
          color: var(--lime);
          font-size: 16px;
          overflow-wrap: anywhere;
        }
        .reference-modal-header button {
          width: 28px;
          height: 28px;
          flex: 0 0 auto;
          border: 1px solid var(--border);
          border-radius: 7px;
          background: var(--surface-2);
          color: var(--text-secondary);
          font: inherit;
          font-size: 20px;
          line-height: 1;
          cursor: pointer;
        }
        .reference-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 14px;
        }
        .reference-meta span {
          padding: 4px 7px;
          border-radius: 999px;
          background: rgba(227, 242, 74, 0.1);
          color: var(--lime);
          font-size: 11px;
        }
        .reference-intro {
          margin: 14px 0 8px;
          color: var(--text-secondary);
          font-size: 12px;
        }
        .reference-sections {
          display: flex;
          flex-direction: column;
          gap: 12px;
          overflow: auto;
        }
        .reference-section {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .reference-modal blockquote {
          margin: 0;
          padding: 13px;
          overflow: auto;
          border: 1px solid var(--border);
          border-left: 3px solid var(--lime);
          border-radius: 8px;
          background: var(--surface-2);
          color: var(--text-primary);
          font-size: 12px;
          line-height: 1.65;
          white-space: pre-wrap;
        }
        .reference-done {
          align-self: flex-end;
          margin-top: 16px;
          padding: 8px 14px;
          border: 1px solid var(--lime);
          border-radius: 999px;
          background: var(--lime);
          color: var(--lime-text);
          font: inherit;
          font-size: 12px;
          font-weight: 650;
          cursor: pointer;
        }
        .conversation-modal {
          width: min(100%, 360px);
          padding: 22px;
          border: 1px solid var(--lime-dim);
          border-radius: 16px;
          background: #252518;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6), 0 0 36px rgba(227, 242, 74, 0.08);
          text-align: center;
        }
        .conversation-modal-badge {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          margin: 0 auto 12px;
          border-radius: 50%;
          background: var(--lime);
          color: var(--lime-text);
          font-size: 21px;
          font-weight: 800;
        }
        .conversation-modal h2 {
          color: var(--lime);
          font-size: 17px;
          font-weight: 650;
        }
        .conversation-modal p {
          margin-top: 8px;
          color: var(--text-secondary);
          font-size: 12px;
          line-height: 1.55;
        }
        .conversation-modal p strong {
          color: var(--text-primary);
          overflow-wrap: anywhere;
        }
        .conversation-name-label {
          display: block;
          margin: 16px 0 6px;
          color: var(--text-muted);
          font-size: 11px;
          text-align: left;
        }
        .conversation-modal input {
          width: 100%;
          padding: 10px 11px;
          border: 1px solid var(--border);
          border-radius: 8px;
          outline: none;
          background: var(--surface-2);
          color: var(--text-primary);
          font: inherit;
          font-size: 13px;
        }
        .conversation-modal input:focus {
          border-color: var(--lime);
          box-shadow: 0 0 0 3px rgba(227, 242, 74, 0.1);
        }
        .conversation-action-error {
          color: #ff9b9b !important;
          text-align: left;
        }
        .conversation-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 9px;
          margin-top: 18px;
        }
        .conversation-modal-actions button {
          padding: 9px 13px;
          border: 1px solid var(--lime-dim);
          border-radius: 999px;
          background: transparent;
          color: var(--text-primary);
          font: inherit;
          font-size: 12px;
          cursor: pointer;
        }
        .conversation-modal-actions .conversation-primary-button {
          border-color: var(--lime);
          background: var(--lime);
          color: var(--lime-text);
          font-weight: 650;
        }
        .conversation-modal-actions button:disabled {
          cursor: wait;
          opacity: 0.6;
        }
        .delete-modal {
          width: min(100%, 390px);
          padding: 24px;
          border: 1px solid var(--lime-dim);
          border-radius: 16px;
          background: #252518;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6), 0 0 36px rgba(227, 242, 74, 0.08);
          text-align: center;
        }
        .delete-modal-icon {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          margin: 0 auto 14px;
          border-radius: 50%;
          background: var(--lime);
          color: var(--lime-text);
          font-size: 22px;
          font-weight: 700;
        }
        .delete-modal h2 {
          font-size: 17px;
          font-weight: 600;
          color: var(--lime);
        }
        .delete-modal p {
          margin-top: 10px;
          color: var(--text-secondary);
          font-size: 12px;
          line-height: 1.55;
        }
        .delete-modal p strong {
          color: var(--text-primary);
          overflow-wrap: anywhere;
        }
        .delete-modal-actions {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: 20px;
        }
        .delete-modal-actions button {
          padding: 9px 14px;
          border: 1px solid var(--lime-dim);
          border-radius: 999px;
          background: transparent;
          color: var(--text-primary);
          font: inherit;
          font-size: 12px;
          cursor: pointer;
        }
        .delete-modal-actions .delete-confirm-btn {
          border-color: var(--lime);
          background: var(--lime);
          color: var(--lime-text);
          font-weight: 600;
        }
        .delete-confirm-btn:disabled {
          cursor: wait;
          opacity: 0.6;
        }
        .knowledge-base-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }
        .knowledge-base-heading .sidebar-section-label {
          margin-bottom: 0;
        }
        .knowledge-upload-btn {
          width: 22px;
          height: 22px;
          display: grid;
          place-items: center;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: var(--surface-2);
          color: var(--lime);
          font-size: 18px;
          line-height: 1;
          cursor: pointer;
        }
        .knowledge-upload-btn:hover:not(:disabled) {
          border-color: var(--lime-dim);
          background: rgba(227, 242, 74, 0.1);
        }
        .knowledge-upload-btn:disabled {
          cursor: wait;
          opacity: 0.6;
        }

       

        .sb-row {
          display: flex;
          width: 100%;
          align-items: center;
          gap: 10px;
          padding: 9px 8px;
          border: 0;
          border-radius: var(--radius-sm);
          background: transparent;
          font-family: inherit;
          text-align: left;
          color: inherit;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .sb-row:hover {
          background: var(--surface-2);
        }
        .history-row {
          position: relative;
          padding-right: 34px;
          outline: none;
        }
        .history-row:focus-visible {
          box-shadow: inset 0 0 0 1px var(--lime);
        }
        .history-more-button {
          position: absolute;
          right: 7px;
          top: 50%;
          width: 24px;
          height: 24px;
          transform: translateY(-50%);
          border: 0;
          border-radius: 6px;
          background: transparent;
          color: var(--text-muted);
          font: inherit;
          font-size: 16px;
          line-height: 1;
          cursor: pointer;
          opacity: 0.55;
        }
        .history-row:hover .history-more-button,
        .history-more-button:focus-visible,
        .history-more-button[aria-expanded="true"] {
          opacity: 1;
        }
        .history-more-button:hover {
          background: var(--surface-3);
          color: var(--lime);
        }
        .history-action-menu {
          position: absolute;
          z-index: 20;
          right: 5px;
          top: calc(100% - 2px);
          width: 110px;
          padding: 4px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--surface-2);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.28);
        }
        .history-action-menu button {
          display: block;
          width: 100%;
          padding: 7px 8px;
          border: 0;
          border-radius: 5px;
          background: transparent;
          color: var(--text-primary);
          font: inherit;
          font-size: 12px;
          text-align: left;
          cursor: pointer;
        }
        .history-action-menu button:hover {
          background: var(--surface-3);
        }
        .history-action-menu .history-delete-button {
          color: #ff8d8d;
        }
        .sb-row + .sb-row {
          border-top: 1px solid var(--border);
          margin-top: 1px;
          padding-top: 10px;
        }

        /* NEW: checkbox indicator + selected state for selectable document rows */
        .sb-row.selectable {
          outline: none;
        }
        .sb-row.selected {
          background: rgba(227, 242, 74, 0.08);
        }
        .document-row.selected .sb-row-title {
          color: var(--lime);
        }
        
        .doc-checkbox.checked {
          background: var(--lime);
          border-color: var(--lime);
        }
        .doc-checkbox svg {
          width: 11px;
          height: 11px;
        }

        .sb-row .file-ico {
          width: 28px;
          height: 28px;
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .file-ico.pdf {
          background: rgba(227, 242, 74, 0.14);
          color: var(--lime);
        }
        .file-ico.docx {
          background: var(--surface-3);
          color: var(--text-secondary);
        }
        .file-ico.txt {
          background: var(--surface-3);
          color: var(--text-secondary);
        }
        .sb-row .file-ico :global(svg) {
          width: 14px;
          height: 14px;
        }

        .sb-row-text {
          min-width: 0;
          flex: 1;
        }
        .sb-row-title {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .sb-row-sub {
          font-size: 11.5px;
          color: var(--text-muted);
          margin-top: 1px;
        }

        // /* NEW: "view all files" row */
        // .view-all-row {
        //   color: var(--text-secondary);
        // }
        // .view-all-ico {
        //   background: var(--surface-3);
        //   color: var(--lime);
        //   font-size: 10.5px;
        //   font-weight: 700;
        // }
        // .view-all-chevron {
        //   width: 14px;
        //   height: 14px;
        //   color: var(--text-muted);
        //   flex-shrink: 0;
        // }

        .convo-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--border-strong);
          flex-shrink: 0;
        }
        .convo-dot.active {
          background: var(--lime);
        }

        .model-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
        }
        .model-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .model-badge {
          width: 28px;
          height: 28px;
          border-radius: 7px;
          background: var(--lime);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--lime-text);
        }
        .model-badge svg {
          width: 14px;
          height: 14px;
        }
        .model-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary);
        }
        .model-sub {
          font-size: 11.5px;
          color: var(--text-muted);
        }
        .model-select-btn {
          font-size: 11.5px;
          color: var(--text-secondary);
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 2px;
        }
        .model-select-btn:hover {
          color: var(--lime);
        }
        .model-select-btn svg {
          width: 12px;
          height: 12px;
        }

        .storage-card {
          padding: 14px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
        }
        .storage-top {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 10px;
        }
        .storage-label {
          font-size: 12.5px;
          color: var(--text-secondary);
          font-weight: 500;
        }
        .storage-value {
          font-size: 11.5px;
          color: var(--text-muted);
        }
        .storage-track {
          width: 100%;
          height: 6px;
          border-radius: 4px;
          background: var(--surface-3);
          overflow: hidden;
        }
        .storage-fill {
          height: 100%;
          border-radius: 4px;
          background: var(--lime);
          width: 38%;
        }

        /* NEW: "view all files" modal */
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(8, 8, 6, 0.6);
          backdrop-filter: blur(2px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: var(--sp-3);
          animation: fadeIn 0.15s ease;
        }
        .modal-panel {
          width: 100%;
          max-width: 460px;
          max-height: min(640px, 86vh);
          background: var(--surface);
          border: 1px solid var(--border-strong);
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
        }
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--sp-2) var(--sp-3);
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }
        .modal-header h3 {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .modal-close {
          width: 30px;
          height: 30px;
          border-radius: var(--radius-sm);
          border: none;
          background: transparent;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .modal-close:hover {
          background: var(--surface-3);
          color: var(--lime);
        }
        .modal-close svg {
          width: 15px;
          height: 15px;
        }
        .modal-body {
          flex: 1;
          overflow-y: auto;
          padding: 6px var(--sp-2);
        }
        .modal-empty {
          color: var(--text-muted);
          font-size: 13px;
          padding: var(--sp-3);
          text-align: center;
        }
        .modal-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--sp-2) var(--sp-3);
          border-top: 1px solid var(--border);
          flex-shrink: 0;
        }
        .modal-footer-count {
          font-size: 12px;
          color: var(--text-muted);
        }
        .modal-done-btn {
          background: var(--lime);
          color: var(--lime-text);
          border: none;
          border-radius: var(--radius-sm);
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .modal-done-btn:hover {
          background: var(--lime-strong);
        }

        :global(::-webkit-scrollbar) {
          width: 8px;
          height: 8px;
        }
        :global(::-webkit-scrollbar-thumb) {
          background: var(--border-strong);
          border-radius: 8px;
        }
        :global(::-webkit-scrollbar-thumb:hover) {
          background: var(--lime-dim);
        }
        :global(::-webkit-scrollbar-track) {
          background: transparent;
        }

        /* ===== Responsive breakpoints ===== */

        /* Tablets: narrower sidebar instead of full 300px */
        @media (max-width: 1180px) {
          .sidebar {
            flex-basis: 260px;
          }
        }

        /* Small tablets / phones: sidebar becomes a slide-out panel. */
        @media (max-width: 980px) {
          .sidebar {
            position: fixed;
            z-index: 60;
            top: 64px;
            right: 0;
            bottom: 0;
            width: min(86vw, 340px);
            padding: 48px var(--sp-3) var(--sp-3);
            border-left: 1px solid var(--border);
            box-shadow: -18px 0 38px rgba(0, 0, 0, 0.28);
            transform: translateX(100%);
            transition: transform 0.22s ease;
          }
          .main.sidebar-is-hidden .sidebar,
          .main.sidebar-is-open .sidebar {
            display: flex;
          }
          .main.sidebar-is-open .sidebar {
            transform: translateX(0);
          }
          .sidebar-scrim {
            position: fixed;
            z-index: 50;
            top: 64px;
            right: 0;
            bottom: 0;
            left: 0;
            display: block;
            border: 0;
            background: rgba(0, 0, 0, 0.48);
            cursor: pointer;
          }
          .sidebar-close {
            position: absolute;
            top: 8px;
            right: 8px;
            z-index: 1;
            display: grid;
            width: 28px;
            height: 28px;
            place-items: center;
            border: 1px solid var(--border);
            border-radius: 7px;
            background: var(--surface-2);
            color: var(--text-secondary);
            font: inherit;
            font-size: 20px;
            line-height: 1;
            cursor: pointer;
          }
          .sidebar-close:hover {
            color: var(--lime);
            border-color: var(--lime-dim);
          }
          .chat-col {
            border-right: none;
          }
          .header-search {
            margin: 0 var(--sp-2);
          }
        }

        /* Phones: tighten up header, bubbles, composer, chat padding */
        @media (max-width: 640px) {
          header {
            height: 56px;
            padding: 0 var(--sp-2);
            gap: 8px;
          }
          .sidebar {
            top: 56px;
          }
          .sidebar-scrim {
            top: 56px;
          }
          .brand-name {
            display: none;
          }
          .header-search {
            margin: 0;
          }
          .header-search input {
            height: 34px;
            font-size: 13px;
            padding-left: 34px;
          }
          .header-actions {
            gap: 2px;
          }
          .header-actions .icon-btn:not(.sidebar-toggle) {
            display: none;
          }

          .chat-inner {
            padding: 0 var(--sp-2);
            gap: var(--sp-2);
          }
          .bubble-wrap {
            max-width: 88%;
          }
          .bubble {
            font-size: 14px;
            padding: 10px 12px;
          }

          .input-area {
            padding: var(--sp-1) var(--sp-2) var(--sp-2);
          }
          .composer {
            padding: 8px 8px 8px 12px;
            border-radius: var(--radius);
          }
          .composer-hint {
            flex-direction: column;
            gap: 2px;
          }

          .selected-doc-chip {
            font-size: 12px;
          }
          .selected-doc-name {
            max-width: 110px;
          }

          .modal-backdrop {
            padding: 0;
            align-items: flex-end;
          }
          .modal-panel {
            max-width: 100%;
            width: 100%;
            max-height: 82vh;
            border-radius: var(--radius-lg) var(--radius-lg) 0 0;
          }
        }

        /* Very small phones */
        @media (max-width: 380px) {
          .header-search {
            display: block;
            min-width: 0;
          }
          .bubble-wrap {
            max-width: 94%;
          }
        }
      `}</style>
    </div>
  );
}
