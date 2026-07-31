type AlienLogoProps = {
  className?: string;
};

/** The shared Docmind mark: a clean alien-head silhouette. */
export function AlienLogo({ className }: AlienLogoProps) {
  return (
    <svg
      className={["docmind-alien-logo", className].filter(Boolean).join(" ")}
      viewBox="0 0 64 64"
      fill="none"
      role="img"
      aria-label="Docmind alien head"
    >
      <path
        d="M24 18 17 8M40 18l7-10"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="16" cy="7" r="3" fill="currentColor" />
      <circle cx="48" cy="7" r="3" fill="currentColor" />
      <path
        d="M32 13C20 13 12 23 13 38c1 12 9 20 19 20s18-8 19-20c1-15-7-25-19-25Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function DocmindWordmark({ dark = false }: { dark?: boolean }) {
  return (
    <span className={`brand-name pixel${dark ? " brand-name-dark" : ""}`}>
      DOCMIND
    </span>
  );
}
