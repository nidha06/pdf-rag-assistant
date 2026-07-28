"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useDocmindStore,
  FileIcon,
  conversations,
} from "../store/chatStore";
import { useSendMessageMutation } from "../hooks/useChatMutations";
import {
  useDocuments,
  useUploadFilesMutation,
} from "../hooks/useKnowledgeBaseMutations";
import { useCurrentUser } from "../hooks/useUserMutations";

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

export default function DocmindPage() {
  const messages = useDocmindStore((s) => s.messages);
  const attachments = useDocmindStore((s) => s.attachments);
  const input = useDocmindStore((s) => s.input);
  const isTyping = useDocmindStore((s) => s.isTyping);
  const dragOver = useDocmindStore((s) => s.dragOver);
  //  const { data: document, isLoading, error } = useDocuments();

  const setInput = useDocmindStore((s) => s.setInput);
  const setDragOver = useDocmindStore((s) => s.setDragOver);
  const setIsTyping = useDocmindStore((s) => s.setIsTyping);
  const submitUserMessage = useDocmindStore((s) => s.submitUserMessage);
  const appendAiMessage = useDocmindStore((s) => s.appendAiMessage);
  const addAttachment = useDocmindStore((s) => s.addAttachment);
  const removeAttachment = useDocmindStore((s) => s.removeAttachment);

  const queryClient = useQueryClient();
  const sendMessageMutation = useSendMessageMutation();
  const uploadFilesMutation = useUploadFilesMutation();
  const isSending = sendMessageMutation.isPending;

  // NEW: which knowledge-base documents (from the sidebar) are selected to
  // scope the next question, and whether the "view all files" modal is open.
  // Purely additive local UI state — doesn't touch the Zustand store.
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [showAllDocsModal, setShowAllDocsModal] = useState(false);

  const {
  data: documentsData,
  isLoading,
  error,
} = useDocuments();

const documents = Array.isArray(documentsData)
  ? documentsData
  : documentsData?.documents ?? [];

  const visibleSidebarDocs = documents.slice(0, SIDEBAR_DOC_LIMIT);
  const hasMoreDocs = documents.length > SIDEBAR_DOC_LIMIT;
  const selectedDocs = documents.filter((d: any) => selectedDocIds.includes(d.id));

  function toggleDocSelection(id: string) {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  // Real current user, replacing the hardcoded "Maren Ruiz" profile card.
  const { data: user } = useCurrentUser();
   
//   if (isLoading) {
//   return <div>Loading...</div>;
// }
  function sendMessage() {
    const question = input.trim();

    if (!question || isSending) return;

    // Send a small amount of recent history so Gemini can understand
    // follow-up questions in both general-chat and document-chat modes.
    const history = messages.slice(-10).map((message) => ({
      role: message.role === "ai" ? "assistant" : "user",
      content: message.content,
    }));

    // Adds the user's message to Zustand and clears the composer.
    submitUserMessage();

    setIsTyping(true);
    sendMessageMutation.mutate(
      {
        question,
        documentIds: selectedDocIds,
        history,
      },
      {
        onSuccess: (result) => {
          appendAiMessage(result.answer);
        },
        onError: () => {
          appendAiMessage(
            "Sorry, something went wrong reaching the model. Please try again."
          );
          // Put the failed question back so the user can retry it.
          setInput(question);
        },
        onSettled: () => {
          setIsTyping(false);
        },
      }
    );
  }

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
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

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (!files.length) return;

    // Optimistic preview chips in the composer while the upload is in flight.
    files.forEach((f) => {
      addAttachment(f.name, formatBytes(f.size));
    });

    // Real upload to the backend, then refresh the sidebar document list.
    uploadFilesMutation.mutate(
      { files },
      {
        onSuccess: () => {
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

 function renderSelectableDocRow(document: any) {
  const isSelected = selectedDocIds.includes(document.id);
  return (
    <div
      className={`doc-row ${isSelected ? "selected" : ""}`}
      key={document.id}
      onClick={() => toggleDocSelection(document.id)}
      role="checkbox"
      aria-checked={isSelected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleDocSelection(document.id);
        }
      }}
    >
      <span className={`doc-file-ico ${getFileKind(document.fileName)} ${isSelected ? "is-checked" : ""}`}>
        {isSelected ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        ) : (
          <FileIcon />
        )}
      </span>

      <div className="doc-row-text">
        <div className="doc-row-title">{document.fileName}</div>
      </div>
    </div>
  );
}
  

  return (
    <div className="app">
      {/* ===== Header ===== */}
      <header>
        <div className="brand">
          <div className="brand-mark">
            <svg viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="6" height="6" fill="#14140F" />
              <rect x="9" y="1" width="6" height="6" fill="#14140F" opacity="0.55" />
              <rect x="1" y="9" width="6" height="6" fill="#14140F" opacity="0.55" />
              <rect x="9" y="9" width="6" height="6" fill="#14140F" />
            </svg>
          </div>
          <span className="brand-name pixel">DOCMIND</span>
        </div>

        <div className="header-search">
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input type="text" placeholder="Search conversations and documents" />
        </div>

        <div className="header-actions">
          <button className="icon-btn" aria-label="Notifications">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="notif-dot" />
          </button>
          <button className="icon-btn" aria-label="Settings">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </header>

      {/* ===== Main ===== */}
      <div className="main">
        {/* Chat column */}
        <div className="chat-col">
          <div
            className="chat-scroll"
            ref={scrollRef}
            style={{ backgroundImage: doodleBackground }}
          >
            <div className="chat-inner">
              <div className="day-divider">Today</div>

              {messages.map((m) => (
                <div className={`msg ${m.role}`} key={m.id}>
                  <div className={`msg-avatar ${m.role === "ai" ? "pixel" : ""}`}>
                    {m.role === "ai" ? "AI" : getInitials(user?.name)}
                  </div>
                  <div className="bubble-wrap">
                    <div className="bubble">{m.content}</div>
                    <span className="msg-time">{m.time}</span>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="msg ai">
                  <div className="msg-avatar pixel">AI</div>
                  <div className="bubble-wrap">
                    <div className="bubble">
                      <span className="typing-indicator">
                        <span />
                        <span />
                        <span />
                      </span>
                    </div>
                  </div>
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

              {attachments.length > 0 && (
                <div className="attachments-preview">
                  {attachments.map((a: any) => (
                    <div className="attachment-chip" key={a.id}>
                      <span className="file-ico">
                        <FileIcon />
                      </span>
                      <div className="file-meta">
                        <div className="file-name">{a.name}</div>
                        <div className="file-size">{a.size}</div>
                      </div>
                      <button
                        type="button"
                        className="remove-btn"
                        aria-label={`Remove ${a.name}`}
                        onClick={() => removeAttachment(a.id)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 6 6 18" />
                          <path d="m6 6 12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
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
                    selectedDocIds.length > 0
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
                  {selectedDocIds.length > 0
                    ? `Document chat · ${selectedDocIds.length} selected`
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
        <aside className="sidebar">
          <div className="profile-block">
            <div className="profile-card">
              <div className="avatar">
                {getInitials(user?.name)}
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
            </div>
            
          </div>
<div className="sidebar-section-label">Knowledge Base</div>

<div className="doc-list-container">
  {isLoading && (
    <div className="doc-list-loading">
      <span className="spinner" />
      Updating library...
    </div>
  )}

  {!isLoading && documents?.length === 0 && (
    <div className="doc-list-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="9" y1="15" x2="15" y2="15" />
      </svg>
      <p>No documents found</p>
    </div>
  )}

  <div className="doc-rows-wrapper">
    {visibleSidebarDocs.map((document: any) => renderSelectableDocRow(document))}
  </div>

  {hasMoreDocs && (
    <button
      className="view-all-action"
      onClick={() => setShowAllDocsModal(true)}
    >
      <div className="stacked-icons">
        <span />
        <span />
        <span />
      </div>
      <div className="view-all-text">
        <span className="title">View all {documents.length} files</span>
        <span className="sub">Manage your knowledge base</span>
      </div>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="m9 18 6-6-6-6" />
      </svg>
    </button>
  )}
</div>

          <div>
            <div className="sidebar-section-label">Recent conversations</div>
            <div className="sb-card">
              {conversations.map((c, i) => (
                <div className="sb-row" key={i}>
                  <span className={`convo-dot ${c.active ? "active" : ""}`} />
                  <div className="sb-row-text">
                    <div className="sb-row-title">{c.name}</div>
                    <div className="sb-row-sub">{c.meta}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="sidebar-section-label">Model</div>
            <div className="model-card">
              <div className="model-info">
                <div className="model-badge">
                  <svg viewBox="0 0 24 24" fill="none">
                    <rect x="4" y="4" width="6" height="6" />
                    <rect x="14" y="4" width="6" height="6" opacity="0.5" />
                    <rect x="4" y="14" width="6" height="6" opacity="0.5" />
                    <rect x="14" y="14" width="6" height="6" />
                  </svg>
                </div>
                <div>
                  <div className="model-name">Precise</div>
                  <div className="model-sub">Best for long documents</div>
                </div>
              </div>
              <button className="model-select-btn">
                Change
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
            </div>
          </div>

          <div>
            <div className="sidebar-section-label">Storage</div>
            <div className="storage-card">
              <div className="storage-top">
                <span className="storage-label">3.8 GB used</span>
                <span className="storage-value">of 10 GB</span>
              </div>
              <div className="storage-track">
                <div className="storage-fill" />
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ===== "View all files" modal ===== */}
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
              {documents.length === 0 ? (
                <p className="modal-empty">No documents uploaded</p>
              ) : (
                documents.map((document: any) => renderSelectableDocRow(document))
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

/* States */
.doc-list-loading {
  padding: 20px;
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--border);
  border-top-color: var(--lime);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
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
        }

        .chat-col {
          flex: 1 1 75%;
          display: flex;
          flex-direction: column;
          min-width: 0;
          border-right: 1px solid var(--border);
        }

        .chat-scroll {
          flex: 1;
          overflow-y: auto;
          padding: var(--sp-4) 0;
          background-repeat: repeat;
          background-size: 260px 260px;
          background-attachment: local;
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
          font-size: 8px;
        }
        .msg.user .msg-avatar {
          background: var(--surface-3);
          color: var(--text-secondary);
        }

        .bubble-wrap {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-width: 78%;
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

        .typing-indicator {
          display: flex;
          gap: 4px;
          padding: 4px 0;
        }
        .typing-indicator span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--lime);
          animation: blink 1.3s infinite ease-in-out;
        }
        .typing-indicator span:nth-child(2) {
          animation-delay: 0.15s;
        }
        .typing-indicator span:nth-child(3) {
          animation-delay: 0.3s;
        }
        @keyframes blink {
          0%,
          80%,
          100% {
            opacity: 0.25;
          }
          40% {
            opacity: 1;
          }
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

        .profile-block {
          background: var(--lime);
          border-radius: var(--radius);
          padding: 4px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .profile-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 12px;
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

       

        .sb-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 8px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .sb-row:hover {
          background: var(--surface-2);
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

        /* Small tablets / large phones: drop the sidebar, header search shrinks */
        @media (max-width: 980px) {
          .sidebar {
            display: none;
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
            display: none;
          }
          .bubble-wrap {
            max-width: 94%;
          }
        }
      `}</style>
    </div>
  );
}