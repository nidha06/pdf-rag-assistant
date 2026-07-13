"use client";

import { useState } from "react";

/**
 * Docmind — Sign up
 * Single-file Next.js page. Drop this in as `app/signup/page.tsx`
 * (App Router) or `pages/signup.tsx` (Pages Router, drop the
 * "use client" line).
 *
 * Mirrors the sign-in page 1:1 — same tokens, same brand panel,
 * same alien-touched illustration and doodle background — so the
 * two screens read as one continuous flow.
 */

function EyeIcon({ off }: { off: boolean }) {
  return off ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <path d="M2 2l20 20" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 6-10 7L2 6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

/**
 * Brand logo (embedded as a data URI so this stays a single file).
 * Same asset used across every Docmind screen — sign in, sign up,
 * knowledge base, chat — so the mark is identical everywhere. Swap
 * for an <Image src="/logo.png" /> import if you'd rather serve it
 * from /public in your own project.
 */
const logoDataUri =
  "data:image/png;base64,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";

/**
 * Same alien-touched doodle tile used on the sign-in page — a few
 * familiar bot / interface motifs plus a passing saucer, a stray
 * tentacle-antenna, and a distant ringed planet. Tinted dark so it
 * reads on the lime brand panel.
 */
const doodleSvgTile = `
<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'>
  <g fill='none' stroke='rgba(20,20,15,0.09)' stroke-width='2.2' stroke-linecap='square' stroke-linejoin='miter'>
    <!-- bot face -->
    <rect x='18' y='22' width='34' height='26' rx='2'/>
    <rect x='26' y='31' width='5' height='5' fill='rgba(20,20,15,0.09)' stroke='none'/>
    <rect x='39' y='31' width='5' height='5' fill='rgba(20,20,15,0.09)' stroke='none'/>
    <line x1='35' y1='22' x2='35' y2='14'/>
    <rect x='32' y='9' width='6' height='6' fill='rgba(20,20,15,0.09)' stroke='none'/>
    <line x1='18' y1='40' x2='10' y2='40'/>
    <line x1='52' y1='40' x2='60' y2='40'/>

    <!-- sparkle -->
    <path d='M238 30 L241 41 L252 44 L241 47 L238 58 L235 47 L224 44 L235 41 Z' fill='rgba(20,20,15,0.08)' stroke='none'/>
    <path d='M262 62 L264 68 L270 70 L264 72 L262 78 L260 72 L254 70 L260 68 Z' fill='rgba(20,20,15,0.08)' stroke='none'/>

    <!-- chat bubble with typing dots -->
    <rect x='78' y='120' width='46' height='32' rx='6'/>
    <path d='M90 152 L90 160 L100 152 Z'/>
    <circle cx='90' cy='136' r='2' fill='rgba(20,20,15,0.1)' stroke='none'/>
    <circle cx='101' cy='136' r='2' fill='rgba(20,20,15,0.1)' stroke='none'/>
    <circle cx='112' cy='136' r='2' fill='rgba(20,20,15,0.1)' stroke='none'/>

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
    <rect x='150' y='210' width='6' height='6' fill='rgba(20,20,15,0.08)' stroke='none'/>
    <rect x='162' y='210' width='6' height='6' fill='rgba(20,20,15,0.08)' stroke='none'/>
    <rect x='174' y='210' width='6' height='6' fill='rgba(20,20,15,0.08)' stroke='none'/>

    <!-- flying saucer, alien touch -->
    <ellipse cx='250' cy='195' rx='26' ry='7'/>
    <path d='M234 195 Q250 178 266 195'/>
    <line x1='244' y1='202' x2='240' y2='214'/>
    <line x1='250' y1='203' x2='250' y2='216'/>
    <line x1='256' y1='202' x2='260' y2='214'/>

    <!-- distant ringed planet -->
    <circle cx='96' cy='260' r='12'/>
    <ellipse cx='96' cy='260' rx='22' ry='6'/>

    <!-- tentacle antenna squiggle -->
    <path d='M190 30 q6 8 0 16 q-6 8 0 16'/>
  </g>
</svg>`;

const doodleBackground = `url("data:image/svg+xml,${encodeURIComponent(doodleSvgTile)}")`;

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const passwordsMatch = confirm.length === 0 || confirm === password;
  const canSubmit =
    name.trim().length > 1 &&
    email.trim().length > 3 &&
    password.length >= 6 &&
    confirm === password &&
    agree;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setError("");
    setSubmitting(true);
    // Hook this up to your auth call, e.g.:
    // await signUp({ name, email, password })
    setTimeout(() => {
      setSubmitting(false);
      window.location.href = "/knowledge-base";
    }, 900);
  }

  return (
    <div className="app">
      {/* ===== Brand panel ===== */}
      <div className="brand-panel" style={{ backgroundImage: doodleBackground }}>
        <div className="brand-panel-inner">
          <div className="brand">
            <div className="brand-mark">
              <img src={logoDataUri} alt="Docmind logo" />
            </div>
            <span className="brand-name pixel">DOCMIND</span>
          </div>

          <div className="illustration">
            <svg viewBox="0 0 480 360" fill="none">
              {/* ground shadow */}
              <ellipse cx="248" cy="326" rx="168" ry="13" fill="#14140F" opacity="0.08" />

              {/* distant ringed planet, alien touch, upper-left */}
              <g opacity="0.65">
                <circle cx="54" cy="52" r="20" fill="none" stroke="#14140F" strokeOpacity="0.35" strokeWidth="2.2" />
                <ellipse cx="54" cy="52" rx="34" ry="8" fill="none" stroke="#14140F" strokeOpacity="0.4" strokeWidth="2.2" />
                <circle cx="46" cy="45" r="3" fill="#14140F" opacity="0.3" />
              </g>

              {/* flying saucer with tractor beam, alien touch, upper-right */}
              <g>
                <path d="M366 58 L344 108 L400 108 Z" fill="var(--lime-strong)" opacity="0.18" />
                <ellipse cx="372" cy="60" rx="34" ry="9" fill="#14140F" opacity="0.9" />
                <path d="M348 60 Q372 36 396 60" stroke="#14140F" strokeWidth="3" fill="none" opacity="0.9" />
                <ellipse cx="372" cy="52" rx="14" ry="7" fill="var(--lime)" opacity="0.9" />
                <circle cx="356" cy="61" r="3" fill="var(--lime)" />
                <circle cx="372" cy="63" r="3" fill="var(--lime)" />
                <circle cx="388" cy="61" r="3" fill="var(--lime)" />
              </g>

              {/* floating particles */}
              <g fill="#14140F">
                <rect x="46" y="118" width="7" height="7" opacity="0.35" />
                <rect x="420" y="230" width="6" height="6" opacity="0.3" />
                <rect x="392" y="130" width="5" height="5" opacity="0.4" />
                <rect x="64" y="266" width="6" height="6" opacity="0.35" />
              </g>

              {/* circuit trio, bottom-left */}
              <g stroke="#14140F" strokeOpacity="0.55" strokeWidth="2.6" strokeLinecap="round">
                <line x1="70" y1="300" x2="104" y2="316" />
                <line x1="104" y1="316" x2="70" y2="336" />
              </g>
              <g fill="#14140F" opacity="0.6">
                <circle cx="70" cy="300" r="6" />
                <circle cx="104" cy="316" r="6" />
                <circle cx="70" cy="336" r="6" />
              </g>

              {/* sparkles */}
              <path
                d="M64 66 L68 80 L82 84 L68 88 L64 102 L60 88 L46 84 L60 80 Z"
                fill="#14140F"
                opacity="0.85"
              />
              <path
                d="M410 148 L412.5 156 L420.5 158.5 L412.5 161 L410 169 L407.5 161 L399.5 158.5 L407.5 156 Z"
                fill="#14140F"
                opacity="0.55"
              />

              {/* scan arc from bot toward screen */}
              <path
                d="M300 96 Q 258 118 232 148"
                stroke="#14140F"
                strokeOpacity="0.4"
                strokeWidth="2.4"
                strokeDasharray="1 9"
                strokeLinecap="round"
                fill="none"
              />

              {/* screen / document, dark surface to echo the form panel */}
              <rect x="108" y="118" width="240" height="192" rx="16" fill="var(--bg)" stroke="#14140F" strokeOpacity="0.5" strokeWidth="2" />
              {/* toolbar dots */}
              <rect x="130" y="140" width="8" height="8" fill="var(--lime)" opacity="0.85" />
              <rect x="144" y="140" width="8" height="8" fill="var(--lime)" opacity="0.55" />
              <rect x="158" y="140" width="8" height="8" fill="var(--lime)" opacity="0.35" />

              {/* extracted text lines */}
              <rect x="130" y="168" width="150" height="10" rx="4" fill="var(--lime)" opacity="0.85" />
              <rect x="130" y="188" width="120" height="10" rx="4" fill="var(--lime)" opacity="0.4" />
              {/* highlighted answer line */}
              <rect x="130" y="208" width="170" height="16" rx="4" fill="var(--lime)" />
              <rect x="138" y="211" width="30" height="10" rx="2" fill="var(--bg)" opacity="0.55" />
              <rect x="174" y="211" width="50" height="10" rx="2" fill="var(--bg)" opacity="0.55" />
              <rect x="130" y="234" width="96" height="10" rx="4" fill="var(--lime)" opacity="0.4" />
              <rect x="130" y="254" width="134" height="10" rx="4" fill="var(--lime)" opacity="0.25" />

              {/* citation chip pulled from the product UI, overlapping the screen corner */}
              <g transform="translate(246 268)">
                <rect width="150" height="42" rx="10" fill="var(--lime)" stroke="#14140F" strokeOpacity="0.15" strokeWidth="1.5" />
                <rect x="10" y="11" width="20" height="20" rx="4" fill="#14140F" opacity="0.85" />
                <path d="M17 15h6l3 3v9h-9z" fill="var(--lime)" opacity="0.9" />
                <rect x="38" y="13" width="96" height="7" rx="3" fill="#14140F" opacity="0.75" />
                <rect x="38" y="24" width="66" height="6" rx="3" fill="#14140F" opacity="0.4" />
              </g>

              {/* bot, perched on the screen's top edge — third eye + curled antenna give it an alien tell */}
              <g stroke="#14140F" strokeOpacity="0.9" strokeWidth="3.2" strokeLinecap="square" strokeLinejoin="miter">
                <rect x="252" y="46" width="86" height="66" rx="8" />
                <rect x="272" y="70" width="12" height="14" fill="#14140F" stroke="none" />
                <rect x="306" y="70" width="12" height="14" fill="#14140F" stroke="none" />
                <circle cx="295" cy="66" r="4" fill="var(--lime)" stroke="#14140F" strokeWidth="2" />
                <path d="M276 96h36" />
                <path d="M295 46 Q288 34 297 26 Q305 20 300 14" fill="none" />
                <rect x="286" y="14" width="18" height="14" rx="2" fill="#14140F" stroke="none" />
                {/* arm reaching toward the screen */}
                <path d="M252 88 Q 224 96 218 118" />
                <rect x="210" y="112" width="14" height="14" rx="3" fill="#14140F" stroke="none" />
                {/* trailing arm */}
                <line x1="338" y1="86" x2="360" y2="98" />
                <rect x="358" y="94" width="10" height="10" fill="#14140F" stroke="none" />
              </g>

              {/* small alien visitor peeking from behind the screen, bottom-right */}
              <g>
                <ellipse cx="404" cy="286" rx="22" ry="26" fill="var(--lime-strong)" stroke="#14140F" strokeOpacity="0.85" strokeWidth="2.6" />
                <ellipse cx="396" cy="282" rx="6" ry="8" fill="#14140F" />
                <ellipse cx="414" cy="282" rx="6" ry="8" fill="#14140F" />
                <path d="M394 260 Q390 248 384 244" stroke="#14140F" strokeWidth="2.4" fill="none" strokeLinecap="round" />
                <path d="M414 260 Q418 248 424 244" stroke="#14140F" strokeWidth="2.4" fill="none" strokeLinecap="round" />
                <circle cx="384" cy="244" r="2.6" fill="#14140F" />
                <circle cx="424" cy="244" r="2.6" fill="#14140F" />
              </g>
            </svg>
          </div>

          <div className="brand-copy">
            <h1 className="pixel">Your documents, decoded.</h1>
            <p>
              Create a workspace, drop in your files, and start asking
              questions — Docmind keeps every answer grounded in what
              you gave it.
            </p>
          </div>

          <ul className="feature-list">
            <li>
              <span className="tick">✓</span> Free to start, no card required
            </li>
            <li>
              <span className="tick">✓</span> Works across PDF, DOCX and TXT
            </li>
            <li>
              <span className="tick">✓</span> Nothing leaves your workspace
            </li>
          </ul>

          <div className="brand-footer">© {new Date().getFullYear()} Docmind. All rights reserved.</div>
        </div>
      </div>

      {/* ===== Form panel ===== */}
      <div className="form-panel">
        <div className="form-panel-top">
          <span className="mobile-brand pixel">
            <span className="mobile-brand-mark">
              <img src={logoDataUri} alt="Docmind logo" />
            </span>
            DOCMIND
          </span>
          <a className="signup-link" href="/login">
            Already have an account? <strong>Sign in</strong>
          </a>
        </div>

        <div className="form-wrap">
          <div className="form-card">
            <h2>Create your account</h2>
            <p className="form-sub">Set up Docmind and start chatting with your files.</p>

            <div className="oauth-row">
              <button type="button" className="oauth-btn">
                <svg viewBox="0 0 24 24" width="17" height="17">
                  <path
                    fill="#EAE6D6"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  />
                  <path
                    fill="#EAE6D6"
                    opacity="0.75"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.85A11 11 0 0 0 12 23z"
                  />
                  <path
                    fill="#EAE6D6"
                    opacity="0.5"
                    d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.85z"
                  />
                  <path
                    fill="#EAE6D6"
                    opacity="0.35"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.05l3.66 2.85C6.71 7.3 9.14 5.38 12 5.38z"
                  />
                </svg>
                Google
              </button>
              <button type="button" className="oauth-btn">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="#EAE6D6">
                  <path d="M12 .5C5.73.5.5 5.73.5 12.02c0 5.05 3.29 9.33 7.86 10.84.57.1.78-.25.78-.55v-2c-3.2.7-3.87-1.36-3.87-1.36-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.8 1.19 1.83 1.19 3.09 0 4.43-2.7 5.4-5.27 5.69.42.36.78 1.08.78 2.17v3.22c0 .3.21.66.79.55A10.53 10.53 0 0 0 23.5 12c0-6.27-5.23-11.5-11.5-11.5z" />
                </svg>
                GitHub
              </button>
            </div>

            <div className="divider">
              <span>or sign up with email</span>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <label className="field-label" htmlFor="name">
                Full name
              </label>
              <div className={`field ${name ? "filled" : ""}`}>
                <span className="field-ico">
                  <UserIcon />
                </span>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Ada Lovelace"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError("");
                  }}
                />
              </div>

              <label className="field-label field-label-spaced" htmlFor="email">
                Email
              </label>
              <div className={`field ${email ? "filled" : ""}`}>
                <span className="field-ico">
                  <MailIcon />
                </span>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                />
              </div>

              <label className="field-label field-label-spaced" htmlFor="password">
                Password
              </label>
              <div className={`field ${password ? "filled" : ""}`}>
                <span className="field-ico">
                  <LockIcon />
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                />
                <button
                  type="button"
                  className="field-toggle"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  <EyeIcon off={showPassword} />
                </button>
              </div>

              <label className="field-label field-label-spaced" htmlFor="confirm">
                Confirm password
              </label>
              <div className={`field ${confirm ? "filled" : ""} ${!passwordsMatch ? "field-invalid" : ""}`}>
                <span className="field-ico">
                  <LockIcon />
                </span>
                <input
                  id="confirm"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  value={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value);
                    setError("");
                  }}
                />
              </div>
              {!passwordsMatch && <div className="field-hint">Passwords don&apos;t match yet.</div>}

              {error && <div className="form-error">{error}</div>}

              <label className="remember-row">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                />
                <span className="checkbox-box" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                I agree to the <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>
              </label>

              <button className="submit-btn" type="submit" disabled={!canSubmit || submitting}>
                {submitting ? (
                  <span className="submit-loading">
                    <span className="spinner" />
                    Creating account…
                  </span>
                ) : (
                  <>
                    Create account
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </>
                )}
              </button>
              <p className="mobile-signup">
              Already have an account? <a href="/login">Sign in</a>
            </p>
            </form>

          
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
          overflow: hidden;
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
          height: 100vh;
          width: 100%;
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: var(--bg);
          overflow: hidden;
        }

        /* ===== Brand / lime panel ===== */
        .brand-panel {
          background-color: var(--lime);
          background-repeat: repeat;
          background-size: 300px 300px;
          background-image:
            radial-gradient(circle at 100% 0%, rgba(20, 20, 15, 0.06), transparent 55%),
            radial-gradient(circle at 0% 100%, rgba(20, 20, 15, 0.05), transparent 45%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 36px 48px;
          position: relative;
          height: 100vh;
          overflow: hidden;
        }
        .brand-panel-inner {
          width: 100%;
          max-width: 460px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .brand-mark {
          width: 32px;
          height: 32px;
          background: var(--lime-text);
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          overflow: hidden;
        }
        .brand-mark img {
          width: 84%;
          height: 84%;
          object-fit: contain;
        }
        .brand-name {
          font-size: 13px;
          color: var(--lime-text);
        }

        .illustration {
          width: calc(100% + 24px);
          max-width: 420px;
          margin: 0 -12px -4px;
          flex-shrink: 1;
          min-height: 0;
        }
        .illustration svg {
          width: 100%;
          height: auto;
          display: block;
          max-height: 30vh;
        }

        .brand-copy h1 {
          font-family: "Press Start 2P", monospace;
          font-size: 15px;
          line-height: 1.6;
          color: var(--lime-text);
          letter-spacing: 0.5px;
        }
        .brand-copy p {
          margin-top: 10px;
          font-size: 13.5px;
          line-height: 1.55;
          color: var(--lime-text);
          opacity: 0.72;
          max-width: 380px;
        }

        .feature-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .feature-list li {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          font-weight: 500;
          color: var(--lime-text);
        }
        .tick {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--lime-text);
          color: var(--lime);
          font-size: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .brand-footer {
          font-size: 11px;
          color: var(--lime-text);
          opacity: 0.55;
        }

        /* ===== Form / dark panel ===== */
        .form-panel {
          background-color: var(--bg);
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
        }
        .form-panel-top {
          display: none;
          align-items: center;
          justify-content: space-between;
          padding: 24px 28px 0;
        }
        .mobile-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          color: var(--lime);
        }
        .mobile-brand-mark {
          width: 26px;
          height: 26px;
          background: var(--lime);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .mobile-brand-mark img {
          width: 84%;
          height: 84%;
          object-fit: contain;
        }
        .signup-link {
          font-size: 12.5px;
          color: var(--text-secondary);
          text-decoration: none;
        }
        .signup-link strong {
          color: var(--lime);
          font-weight: 600;
        }

        .form-wrap {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 28px 32px;
          min-height: 0;
          overflow-y: auto;
        }

        .form-card {
          width: 100%;
          max-width: 380px;
        }
        .form-card h2 {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.01em;
        }
        .form-sub {
          margin-top: 8px;
          font-size: 14px;
          color: var(--text-secondary);
        }

        .oauth-row {
          display: flex;
          gap: 10px;
          margin-top: 22px;
        }
        .oauth-btn {
          flex: 1;
          height: 42px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 500;
          font-family: "Inter", sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease;
        }
        .oauth-btn:hover {
          background: var(--surface-2);
          border-color: var(--border-strong);
        }

        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 20px 0;
          font-size: 11.5px;
          color: var(--text-muted);
        }
        .divider::before,
        .divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: var(--border);
        }

        .field-label {
          display: block;
          font-size: 12.5px;
          font-weight: 500;
          color: var(--text-secondary);
          margin-bottom: 7px;
        }
        .field-label-spaced {
          margin-top: 14px;
        }
        .forgot-link {
          font-size: 12px;
          color: var(--lime-dim);
          text-decoration: none;
        }
        .forgot-link:hover {
          color: var(--lime);
          text-decoration: underline;
        }

        .field {
          display: flex;
          align-items: center;
          gap: 10px;
          height: 44px;
          padding: 0 12px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
        }
        .field:focus-within {
          border-color: var(--lime-dim);
          background: var(--surface-2);
          box-shadow: 0 0 0 3px rgba(227, 242, 74, 0.14);
        }
        .field-invalid {
          border-color: #ff8a7a;
        }
        .field-hint {
          margin-top: 6px;
          font-size: 11.5px;
          color: #ff8a7a;
        }
        .field-ico {
          color: var(--text-muted);
          display: flex;
          flex-shrink: 0;
        }
        .field.filled .field-ico {
          color: var(--lime-dim);
        }
        .field-ico svg {
          width: 16px;
          height: 16px;
        }
        .field input {
          flex: 1;
          height: 100%;
          border: none;
          outline: none;
          background: transparent;
          color: var(--text-primary);
          font-family: "Inter", sans-serif;
          font-size: 14px;
        }
        .field input::placeholder {
          color: var(--text-muted);
        }
        .field-toggle {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          padding: 2px;
          flex-shrink: 0;
        }
        .field-toggle:hover {
          color: var(--lime);
        }
        .field-toggle svg {
          width: 16px;
          height: 16px;
        }

        .form-error {
          margin-top: 12px;
          font-size: 12.5px;
          color: #ff8a7a;
          background: rgba(255, 138, 122, 0.08);
          border: 1px solid rgba(255, 138, 122, 0.25);
          border-radius: var(--radius-sm);
          padding: 8px 10px;
        }

        .remember-row {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          margin-top: 16px;
          font-size: 12.5px;
          line-height: 1.5;
          color: var(--text-secondary);
          cursor: pointer;
          user-select: none;
        }
        .remember-row a {
          color: var(--lime-dim);
          text-decoration: none;
        }
        .remember-row a:hover {
          color: var(--lime);
          text-decoration: underline;
        }
        .remember-row input {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
        }
        .checkbox-box {
          width: 18px;
          height: 18px;
          border-radius: 5px;
          border: 1.5px solid var(--border-strong);
          background: var(--surface);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--lime-text);
          flex-shrink: 0;
          margin-top: 1px;
          transition: background 0.15s ease, border-color 0.15s ease;
        }
        .checkbox-box svg {
          width: 11px;
          height: 11px;
          opacity: 0;
          transition: opacity 0.1s ease;
        }
        .remember-row input:checked + .checkbox-box {
          background: var(--lime);
          border-color: var(--lime);
        }
        .remember-row input:checked + .checkbox-box svg {
          opacity: 1;
        }
        .remember-row input:focus-visible + .checkbox-box {
          box-shadow: 0 0 0 3px rgba(227, 242, 74, 0.25);
        }

        .submit-btn {
          width: 100%;
          height: 46px;
          margin-top: 20px;
          border: none;
          border-radius: var(--radius-sm);
          background: var(--lime);
          color: var(--lime-text);
          font-family: "Inter", sans-serif;
          font-size: 14.5px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: background 0.15s ease, transform 0.1s ease, box-shadow 0.2s ease;
          box-shadow: 0 10px 24px rgba(227, 242, 74, 0.16);
        }
        .submit-btn svg {
          width: 17px;
          height: 17px;
        }
        .submit-btn:hover:not(:disabled) {
          background: var(--lime-strong);
        }
        .submit-btn:active:not(:disabled) {
          transform: scale(0.98);
        }
        .submit-btn:disabled {
          background: var(--surface-3);
          color: var(--text-muted);
          cursor: not-allowed;
          box-shadow: none;
        }

        .submit-loading {
          display: flex;
          align-items: center;
          gap: 9px;
        }
        .spinner {
          width: 15px;
          height: 15px;
          border-radius: 50%;
          border: 2px solid rgba(20, 20, 15, 0.25);
          border-top-color: var(--lime-text);
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .mobile-signup {
          display: none;
          text-align: center;
          margin-top: 22px;
          font-size: 13px;
          color: var(--text-secondary);
        }
        .mobile-signup a {
          color: var(--lime);
          font-weight: 600;
          text-decoration: none;
        }

        :global(::-webkit-scrollbar) {
          width: 8px;
          height: 8px;
        }
        :global(::-webkit-scrollbar-thumb) {
          background: var(--border-strong);
          border-radius: 8px;
        }
        :global(::-webkit-scrollbar-track) {
          background: transparent;
        }

        @media (max-width: 900px) {
          html,
          body {
            overflow: auto;
          }
          .app {
            grid-template-columns: 1fr;
            height: auto;
            overflow: visible;
          }
          .brand-panel {
            display: none;
          }
          .form-panel {
            height: auto;
            overflow: visible;
          }
          .form-panel-top {
            display: flex;
          }
          .mobile-signup {
            display: block;
          }
          .signup-link {
            display: none;
          }
          .form-wrap {
            overflow-y: visible;
          }
        }

        @media (max-width: 420px) {
          .form-wrap {
            padding: 24px 20px;
          }
          .oauth-row {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}