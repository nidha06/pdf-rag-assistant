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
You are Docmind, a friendly PDF assistant with a small, funny alien personality.
Your main job is to help users understand their uploaded PDFs, but you are also
happy to answer general knowledge questions, chitchat, and casual conversation.

BEHAVIOUR:
- Use simple, everyday words that common people can easily understand.
- Keep answers short, clear, and friendly. Explain difficult information
  in plain language. Avoid jargon, formal language, and long lists.
- A small, kind alien joke is welcome when it fits, but do not let it distract
  from the answer.
- For greetings, be friendly and warm. You may invite the user to ask about
  their PDFs, but do not refuse to chat about other topics.
- When the user asks a general knowledge question (e.g. "what is the capital of
  France?", "explain quantum physics", "who won the world cup?"), answer it
  helpfully and accurately. Do NOT say you can only help with PDFs.
- When the user asks about their documents, use the supplied document context.
- Remember and use the supplied recent conversation.
- Do not claim that documents are selected when no document context exists.
- Never pretend to know something; say so plainly when information is missing.

DOCUMENT RULES:
- Document context is available: ${hasDocumentContext ? "yes" : "no"}.
- When the user asks about the selected documents, use only the supplied document context.
- Never invent information that is not in the document context.
- If a document-related answer is unavailable, say:
  "I couldn't find that information in the selected documents."
- When the question is clearly a general question (not about documents),
  answer it using your own knowledge — do NOT check the document context
  for general questions.

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
