"use client";

import { useRef, useState } from "react";
import { useUploadFilesMutation } from "../hooks/useKnowledgeBaseMutations";
import { useCurrentUser } from "../hooks/useUserMutations";
import { useRouter } from "next/navigation";

/**
 * Docmind — Knowledge base upload page
 * Single-file Next.js page. Drop this in as `app/knowledge-base/page.tsx`
 * (App Router) or `pages/knowledge-base.tsx` (Pages Router, drop the
 * "use client" line).
 *
 * Matches the visual language of the Docmind chat page: same color
 * tokens, same Press Start 2P / Inter pairing, same doodle background.
 * No external CSS files needed — styling is done with styled-jsx.
 */

type UploadedFile = {
  id: string;
  name: string;
  size: string;
  file: File;
};

/** Same low-opacity pixel-styled AI doodle tile used on the chat page. */
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

/**
 * Brand logo (embedded as a data URI so this stays a single file).
 * Swap for an <Image src="/logo.png" /> import if you'd rather serve it
 * from /public in your own project.
 */
const logoDataUri =
  "data:image/png;base64,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";

function formatSize(bytes: number) {
  const kb = bytes / 1024;
  return kb > 1024 ? (kb / 1024).toFixed(1) + " MB" : kb.toFixed(0) + " KB";
}

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

export default function KnowledgeBasePage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {data:user} = useCurrentUser()
  const router = useRouter();
  
  console.log("USER DETAILS: ",user);
  function addFiles(fileList: FileList | File[]) {
    const selectedFiles = Array.from(fileList);
    const pdfFiles = selectedFiles.filter(
      (file) =>
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf")
    );

    if (pdfFiles.length !== selectedFiles.length) {
      setFileError("Only PDF files are supported.");
    } else {
      setFileError("");
    }

    const incoming = pdfFiles.map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      size: formatSize(f.size),
      file: f,
    }));
    setFiles((prev) => [...prev, ...incoming]);
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  function handleBrowseFiles(){
    if(!user){
        router.push("/auth/login");
        return 
    }
    fileInputRef.current?.click();
  }

  function handleDrop(e: React.DragEvent) {

    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  }

  const uploadMutation = useUploadFilesMutation();

function handleContinue() {
  if (files.length === 0) return;
 



  uploadMutation.mutate(
    {
      files: files.map((f) => f.file),
  
    },
    {
      onSuccess: (data) => {
        console.log(data);
         window.location.href = "/chat"
      },
      onError: (err) => {
        console.log(err);
      },
    }
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
        <span className="header-tag">Knowledge base setup</span>
      </header>

      {/* ===== Canvas ===== */}
      <div className="canvas" style={{ backgroundImage: doodleBackground }}>
        <div className="hero">
          <div className="logo-badge">
            <img src={logoDataUri} alt="Docmind logo" />
          </div>

          <div>
            <div className="hero-title pixel">DOCMIND</div>
            <p className="hero-sub">
              Upload the documents you want to talk to. Docmind reads them
              once, then answers questions, pulls numbers, and drafts
              summaries — all grounded in what you gave it.
            </p>
          </div>

          <div className="upload-card">
            <div
              className={`dropzone ${dragOver ? "drag-over" : ""}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <div className="dropzone-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
              </div>
              <div className="dropzone-title">Drag & drop files here</div>
              <div className="dropzone-sub">PDF files only</div>
              <div className="dropzone-sub">or</div>
              <button
                className="browse-btn"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                 handleBrowseFiles();
                }}
              >
                Browse files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="application/pdf,.pdf"
                onChange={(e) => {
                  if (e.target.files?.length) addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>

            {fileError && <p role="alert">{fileError}</p>}

            {files.length > 0 && (
              <div className="file-list">
                {files.map((f) => (
                  <div className="file-row" key={f.id}>
                    <span className="file-ico">
                      <FileIcon />
                    </span>
                    <div className="file-meta">
                      <div className="file-name">{f.name}</div>
                      <div className="file-sub">{f.size}</div>
                    </div>
                    <button
                      className="file-remove"
                      aria-label="Remove file"
                      onClick={() => removeFile(f.id)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="hint-row">
              <span>PDF, DOCX and TXT supported</span>
              <span>
                {files.length} file{files.length === 1 ? "" : "s"} added
              </span>
            </div>
          </div>

          <div className="continue-row">
            <button
              className="arrow-btn"
              disabled={files.length === 0 || uploadMutation.isPending}
              aria-label="Continue to chat"
              onClick={handleContinue}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
            <span className="continue-label">
              {files.length === 0 ? (
                <>
                  Add at least one document to <strong>start chatting</strong>
                </>
              ) : (
                <>
                  Ready to go — <strong>{files.length} document{files.length === 1 ? "" : "s"}</strong> loaded
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Inter:wght@400;500;600;700&display=swap");

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
        }
      `}</style>

      <style jsx>{`
        .pixel {
          font-family: "Press Start 2P", monospace;
          letter-spacing: 0.5px;
        }

        .app {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--bg);
        }

        header {
          height: 64px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 var(--sp-3, 24px);
          border-bottom: 1px solid var(--border);
          background: var(--surface);
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
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
        .header-tag {
          font-size: 12.5px;
          color: var(--text-muted);
        }

        .canvas {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          background-repeat: repeat;
          background-size: 260px 260px;
          background-color: var(--bg);
        }

        .hero {
          width: 100%;
          max-width: 520px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          text-align: center;
        }

        .logo-badge {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          background: var(--lime);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .logo-badge img {
          width: 84%;
          height: 84%;
          object-fit: contain;
        }

        .hero-title {
          font-size: 15px;
          color: var(--lime);
        }
        .hero-sub {
          margin-top: 12px;
          font-size: 14px;
          line-height: 1.6;
          color: var(--text-secondary);
        }

        .upload-card {
          width: 100%;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 20px;
        }

        .dropzone {
          border: 1.5px dashed var(--border-strong);
          border-radius: var(--radius);
          padding: 32px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .dropzone:hover {
          border-color: var(--lime-dim);
          background: var(--surface-2);
        }
        .dropzone.drag-over {
          border-color: var(--lime);
          background: var(--surface-2);
          box-shadow: 0 0 0 4px rgba(227, 242, 74, 0.14);
        }
        .dropzone input {
          display: none;
        }
        .dropzone-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--surface-3);
          color: var(--lime);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 6px;
        }
        .dropzone-icon svg {
          width: 18px;
          height: 18px;
        }
        .dropzone-title {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
        }
        .dropzone-sub {
          font-size: 12px;
          color: var(--text-muted);
        }

        .browse-btn {
          margin-top: 6px;
          height: 36px;
          padding: 0 16px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
          background: var(--surface-2);
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 500;
          font-family: "Inter", sans-serif;
          cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
        }
        .browse-btn:hover {
          background: var(--surface-3);
          border-color: var(--lime-dim);
          color: var(--lime);
        }

        .file-list {
          margin-top: 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .file-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
        }
        .file-row .file-ico {
          width: 28px;
          height: 28px;
          border-radius: 7px;
          background: rgba(227, 242, 74, 0.14);
          color: var(--lime);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .file-row .file-ico svg {
          width: 14px;
          height: 14px;
        }
        .file-meta {
          flex: 1;
          min-width: 0;
          text-align: left;
        }
        .file-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .file-sub {
          font-size: 11.5px;
          color: var(--text-muted);
          margin-top: 1px;
        }
        .file-remove {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: none;
          background: transparent;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .file-remove:hover {
          background: var(--surface-3);
          color: var(--lime);
        }
        .file-remove svg {
          width: 12px;
          height: 12px;
        }

        .hint-row {
          display: flex;
          justify-content: space-between;
          margin-top: 14px;
          font-size: 11.5px;
          color: var(--text-muted);
        }

        .continue-row {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-top: 4px;
        }
        .arrow-btn {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          border: none;
          background: var(--lime);
          color: var(--lime-text);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.15s ease, transform 0.1s ease;
          box-shadow: 0 10px 24px rgba(227, 242, 74, 0.16);
        }
        .arrow-btn svg {
          width: 20px;
          height: 20px;
        }
        .arrow-btn:hover:not(:disabled) {
          background: var(--lime-strong);
        }
        .arrow-btn:active:not(:disabled) {
          transform: scale(0.96);
        }
        .arrow-btn:disabled {
          background: var(--surface-3);
          color: var(--text-muted);
          cursor: not-allowed;
          box-shadow: none;
        }
        .continue-label {
          font-size: 13px;
          color: var(--text-secondary);
          text-align: left;
        }
        .continue-label strong {
          color: var(--lime);
        }
      `}</style>
    </div>
  );
}
