import "server-only";
import { withGeminiFailover } from "@/lib/gemini";

type HistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

export type IntentType = "document" | "general";

/**
 * Fast keyword check that catches obvious greetings and chitchat before hitting
 * the LLM. Returns `true` for messages that are clearly not about a document.
 */
function isObviousCasualMessage(question: string): boolean {
  const normalized = question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const exactMatches = new Set([
    "hi", "hello", "hey", "hai", "good morning", "good afternoon",
    "good evening", "how are you", "who are you", "what are you",
    "what can you do", "what do you do", "whats your name", "what is your name",
    "tell me a joke", "tell a joke", "thanks", "thank you", "bye", "goodbye",
    "sup", "yo", "hola", "howdy", "ok", "okay", "cool", "nice", "great",
    "good", "lol", "haha", "hehe",
  ]);

  if (exactMatches.has(normalized)) return true;

  return /^(hi|hello|hey|hai|thanks|thank you|bye|goodbye)\b/.test(normalized);
}

/**
 * Keyword-based fallback heuristic used when the LLM classifier is unavailable.
 * Checks if the question likely refers to documents based on keywords and
 * recent conversation context.
 */
function isLikelyDocumentQuestion(
  question: string,
  history: HistoryMessage[]
): boolean {
  const lower = question.toLowerCase();

  // Direct document references
  const docKeywords = [
    "pdf", "document", "file", "page", "chapter", "section",
    "paragraph", "table", "figure", "chart", "summarize",
    "summary", "extract", "uploaded", "attached",
  ];
  if (docKeywords.some((kw) => lower.includes(kw))) return true;

  // Follow-up patterns that reference prior document discussion
  const followUpPatterns = [
    /^(tell|explain|elaborate|expand)\s+(me\s+)?(more|further|again)/,
    /^what (about|else)/,
    /^(can you|could you)\s+(explain|clarify|summarize)/,
    /^(and|also|but)\s+/,
    /\b(it|that|this|those|these)\b.*\?$/,
  ];

  // Only treat follow-ups as document questions if recent history has document discussion
  const hasRecentDocDiscussion = history.slice(-4).some(
    (m) => m.role === "assistant" && (
      m.content.includes("document") ||
      m.content.includes("PDF") ||
      m.content.includes("page")
    )
  );

  if (hasRecentDocDiscussion && followUpPatterns.some((p) => p.test(lower))) {
    return true;
  }

  return false;
}

/**
 * Uses a lightweight Gemini call to classify whether the user's message is
 * asking about their uploaded documents or is a general/chitchat question.
 *
 * The classifier considers conversation history so that follow-up questions
 * like "tell me more" after a PDF discussion are correctly routed to the
 * document pipeline.
 */
export async function classifyIntent({
  question,
  history = [],
  hasDocuments,
  flowId,
}: {
  question: string;
  history?: HistoryMessage[];
  hasDocuments: boolean;
  flowId?: string;
}): Promise<IntentType> {
  const trace = `[intent:${flowId ?? "classify"}]`;

  // Fast path: obvious casual messages never need document lookup
  if (isObviousCasualMessage(question)) {
    console.info(`${trace} fast-path: casual message`);
    return "general";
  }

  // If there are no documents selected at all, everything is general
  if (!hasDocuments) {
    console.info(`${trace} no documents selected — general`);
    return "general";
  }

  // Use Gemini to classify ambiguous questions
  const recentHistory = history
    .slice(-6)
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  const prompt = `You are a strict intent classifier for a PDF assistant app.
The user has PDF documents selected. Your job is to decide if the user's
latest message is asking something ABOUT THEIR DOCUMENTS, or if it is a
GENERAL question, chitchat, or off-topic.

RULES:
- Reply with exactly one word: "document" or "general". Nothing else.
- "document" = the user wants information from or about their uploaded PDF(s).
  This includes follow-up questions referencing earlier document discussion
  (e.g. "tell me more", "explain that", "summarize it", "what about page 3").
- "general" = greetings, chitchat, general knowledge questions, jokes,
  personal questions, or anything that does NOT require looking inside a PDF.
  Examples: "what is the capital of France?", "how are you?", "tell me a joke",
  "what is machine learning?", "who won the world cup?", "what's 2+2?",
  "explain quantum physics", "what's the weather like?"

CONVERSATION HISTORY (for context only):
${recentHistory || "No previous messages."}

USER'S LATEST MESSAGE:
${question}

CLASSIFICATION (one word only):`;

  try {
    const startedAt = Date.now();
    const response = await withGeminiFailover((client) =>
      client.interactions.create({
        model: process.env.GEMINI_CHAT_MODEL ?? "gemini-3.6-flash",
        input: prompt,
        store: false,
      })
    );

    const raw = (response.output_text ?? "").trim().toLowerCase();

    // If the model returned nothing, fall back to document mode
    if (!raw) {
      console.warn(`${trace} empty classification response, defaulting to general`);
      return "general";
    }

    const intent: IntentType = raw.startsWith("document")
      ? "document"
      : "general";

    console.info(`${trace} classified`, {
      raw,
      intent,
      durationMs: Date.now() - startedAt,
    });

    return intent;
  } catch (error) {
    // If classification fails, fall back to using a simple heuristic:
    // check if the question contains document-related keywords.
    console.warn(`${trace} classification failed, using keyword fallback`, error);
    return isLikelyDocumentQuestion(question, history) ? "document" : "general";
  }
}
