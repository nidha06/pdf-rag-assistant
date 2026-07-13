"use client";

import { useLoginStore } from "../../store/loginStore";

/**
 * Docmind — Sign in
 * Single-file Next.js page. Drop this in as `app/login/page.tsx`
 * (App Router) or `pages/login.tsx` (Pages Router, drop the
 * "use client" line).
 *
 * Shares the same design tokens as the rest of Docmind (chat page,
 * knowledge-base upload page): Press Start 2P / Inter pairing, the
 * lime brand color, dark surfaces. No external CSS needed — styling
 * is done with styled-jsx.
 *
 * All form state (email, password, visibility, "remember me",
 * submitting, error) lives in `useLoginStore` (Zustand) — this file
 * only renders and wires up event handlers.
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
 * Same asset used on the Docmind knowledge-base page — keeps the
 * brand mark identical across every screen. Swap for an
 * <Image src="/logo.png" /> import if you'd rather serve it from
 * /public in your own project.
 */
const logoDataUri =
  "data:image/png;base64,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";

/**
 * Low-opacity pixel-styled doodle tile used across Docmind screens —
 * a mix of familiar bot / interface motifs and a few alien touches
 * (a passing saucer, a stray tentacle-antenna, a distant ringed
 * planet) to give the brand its own personality without breaking the
 * lime-on-charcoal system. Tinted dark so it reads on the lime brand
 * panel instead of the charcoal chat surface.
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

export default function LoginPage() {
  const email = useLoginStore((s) => s.email);
  const password = useLoginStore((s) => s.password);
  const showPassword = useLoginStore((s) => s.showPassword);
  const remember = useLoginStore((s) => s.remember);
  const submitting = useLoginStore((s) => s.submitting);
  const error = useLoginStore((s) => s.error);

  const setEmail = useLoginStore((s) => s.setEmail);
  const setPassword = useLoginStore((s) => s.setPassword);
  const toggleShowPassword = useLoginStore((s) => s.toggleShowPassword);
  const setRemember = useLoginStore((s) => s.setRemember);
  const canSubmit = useLoginStore((s) => s.canSubmit());
  const submit = useLoginStore((s) => s.submit);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submit(() => {
      window.location.href = "/";
    });
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
                <rect d="M286 14 18 14" x="286" y="14" width="18" height="14" rx="2" fill="#14140F" stroke="none" />
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
            <h1 className="pixel">Ask your documents anything.</h1>
            <p>
              Drop in contracts, plans, and notes — Docmind reads them once
              and keeps every answer grounded in what you gave it.
            </p>
          </div>

          <ul className="feature-list">
            <li>
              <span className="tick">✓</span> Grounded answers with page-level citations
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
          
        </div>

        <div className="form-wrap">
          <div className="form-card">
            <h2>Welcome back</h2>
            <p className="form-sub">Sign in to pick up your last conversation.</p>

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
              <span>or sign in with email</span>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <label className="field-label" htmlFor="email">
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
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="field-row">
                <label className="field-label" htmlFor="password">
                  Password
                </label>
                <a className="forgot-link" href="/forgot-password">
                  Forgot password?
                </a>
              </div>
              <div className={`field ${password ? "filled" : ""}`}>
                <span className="field-ico">
                  <LockIcon />
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="field-toggle"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => toggleShowPassword()}
                >
                  <EyeIcon off={showPassword} />
                </button>
              </div>

              {error && <div className="form-error">{error}</div>}

              <label className="remember-row">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span className="checkbox-box" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                Keep me signed in on this device
              </label>

              <button className="submit-btn" type="submit" disabled={!canSubmit || submitting}>
                {submitting ? (
                  <span className="submit-loading">
                    <span className="spinner" />
                    Signing in…
                  </span>
                ) : (
                  <>
                    Sign in
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </>
                )}
              </button>
              <a className="signup-link" href="/auth/register">
            Need an account? <strong>Sign up</strong>
          </a>
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
          max-height: 34vh;
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
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 24px 32px 0;
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
          padding: 40px 32px;
          min-height: 0;
        }

        .form-card {
          width: 100%;
          max-width: 380px;
        }
        .form-card h2 {
          font-size: 24px;
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
          margin-top: 28px;
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
          margin: 24px 0;
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
        .field-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-top: 18px;
        }
        .field-row .field-label {
          margin-bottom: 7px;
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
          height: 46px;
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
          align-items: center;
          gap: 9px;
          margin-top: 20px;
          font-size: 13px;
          color: var(--text-secondary);
          cursor: pointer;
          user-select: none;
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
          margin-top: 24px;
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
          margin-top: 28px;
          font-size: 13px;
          color: var(--text-secondary);
        }
        .mobile-signup a {
          color: var(--lime);
          font-weight: 600;
          text-decoration: none;
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
          .form-panel-top{
      justify-content: space-between;
  }
          .mobile-signup {
            display: block;
          }
          .signup-link {
            display: none;
          }
        }

        @media (max-width: 420px) {
          .form-wrap {
            padding: 28px 20px;
          }
          .oauth-row {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}