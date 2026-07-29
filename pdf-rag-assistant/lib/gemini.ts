import "server-only";
import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is missing");
}

export const gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const secondaryGemini = process.env.GEMINI_API_KEY_SECONDARY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY_SECONDARY })
  : null;

function isRateLimitError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const candidate = error as {
    statusCode?: unknown;
    message?: unknown;
    error?: { code?: unknown; message?: unknown };
  };
  const message =
    typeof candidate.error?.message === "string"
      ? candidate.error.message
      : typeof candidate.message === "string"
        ? candidate.message
        : "";

  return (
    candidate.statusCode === 429 ||
    candidate.error?.code === "too_many_requests" ||
    /quota exceeded|rate limit|too many requests/i.test(message)
  );
}

/**
 * Runs a Gemini request with the primary key, retrying once with the optional
 * secondary key only when the primary key is rate-limited or out of quota.
 */
export async function withGeminiFailover<T>(
  operation: (client: GoogleGenAI) => Promise<T>
): Promise<T> {
  try {
    return await operation(gemini);
  } catch (error) {
    if (!secondaryGemini || !isRateLimitError(error)) {
      throw error;
    }

    console.warn("[gemini] primary key rate-limited; retrying with secondary key");
    return operation(secondaryGemini);
  }
}
