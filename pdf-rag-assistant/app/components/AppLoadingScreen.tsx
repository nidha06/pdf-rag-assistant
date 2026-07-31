import { AlienLogo } from "./AlienLogo";

type AppLoadingScreenProps = {
  label?: string;
};

export function AppLoadingScreen({
  label = "Loading",
}: AppLoadingScreenProps) {
  return (
    <div
      className="app-loading-screen"
      role="status"
      aria-live="polite"
      aria-label={label}
      aria-busy="true"
    >
      <div className="app-loading-content">
        <div className="app-loading-alien" aria-hidden="true">
          <AlienLogo />
        </div>
        <span className="app-loading-wordmark">DOCMIND</span>
        <span className="app-loading-label">{label}…</span>
      </div>
    </div>
  );
}
