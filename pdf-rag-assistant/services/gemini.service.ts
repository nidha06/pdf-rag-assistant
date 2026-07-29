import { withGeminiFailover } from "@/lib/gemini";

type ChatHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

type GenerateAnswerData = {
  question: string;
  history?: ChatHistoryMessage[];
  context?: string;
  flowId?: string;
};

export async function generateAnswer({
  question,
  history = [],
  context = "",
  flowId,
}: GenerateAnswerData) {
  const trace = `[chat:${flowId ?? "general"}]`;
  const startedAt = Date.now();
  const conversationHistory = history
    .slice(-10)
    .map((message) => {
      const speaker =
        message.role === "assistant" ? "ASSISTANT" : "USER";

      return `${speaker}: ${message.content}`;
    })
    .join("\n");

  const hasDocumentContext = context.trim().length > 0;

  const prompt = `
You are Docmind, a friendly and helpful AI assistant.

BEHAVIOUR:
- Be witty, warm, and well-educated — like a sharp librarian with excellent
  timing, not a stand-up comedian who misplaced the answer.
- Use a light, occasional joke or playful phrase when it fits, but never let
  humour obscure the answer or appear in serious, sensitive, or error cases.
- Respond naturally to greetings, casual conversation, and general questions.
- Remember and use the supplied recent conversation.
- Keep answers clear, accurate, concise, and easy to scan.
- Lead with the useful answer, then add brief explanation or context when it helps.
- Do not claim that documents are selected when no document context exists.
- Never pretend to know something; say so plainly when information is missing.

DOCUMENT RULES:
- Document context is available: ${hasDocumentContext ? "yes" : "no"}.
- When the user asks about the selected documents, use only the supplied document context.
- Never invent information that is not in the document context.
- If a document-related answer is unavailable, say:
  "I couldn't find that information in the selected documents."
- Normal greetings and general conversation do not need to come from the documents.

RECENT CONVERSATION:
${conversationHistory || "No previous messages."}

DOCUMENT CONTEXT:
${hasDocumentContext ? context : "No documents are selected."}

CURRENT USER MESSAGE:
${question}
`;
  console.info(`${trace} generating general answer`, {
    historyMessages: history.length,
    hasDocumentContext,
  });

  const modelStartedAt = Date.now();
  const response = await withGeminiFailover((client) =>
    client.interactions.create({
      model: process.env.GEMINI_CHAT_MODEL ?? "gemini-3.6-flash",
      input: prompt,
      store: false,
    })
  );
  console.info(`${trace} general answer generated`, {
    answerLength: response.output_text?.length ?? 0,
    modelDurationMs: Date.now() - modelStartedAt,
    totalDurationMs: Date.now() - startedAt,
  });
  return response.output_text;
}
