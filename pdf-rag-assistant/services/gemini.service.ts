import { gemini } from "@/lib/gemini";

type ChatHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

type GenerateAnswerData = {
  question: string;
  history?: ChatHistoryMessage[];
  context?: string;
};

export async function generateAnswer({
  question,
  history = [],
  context = "",
}: GenerateAnswerData) {
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
- Respond naturally to greetings, casual conversation and general questions.
- Remember and use the supplied recent conversation.
- Keep answers clear and conversational.
- Do not claim that documents are selected when no document context exists.

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

  const response = await gemini.interactions.create({
    model: "gemini-3.6-flash",
    input: prompt,
    store: false,
  });

  return response.output_text;
}