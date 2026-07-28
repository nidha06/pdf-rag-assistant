import { NextResponse } from "next/server";
import { generateAnswer } from "@/services/gemini.service";

type ChatHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const question =
      typeof body.question === "string"
        ? body.question.trim()
        : "";

    const documentIds: string[] = Array.isArray(body.documentIds)
      ? body.documentIds.filter(
          (id: unknown): id is string => typeof id === "string"
        )
      : [];

    const history: ChatHistoryMessage[] = Array.isArray(body.history)
      ? body.history
          .filter(
            (message: unknown): message is ChatHistoryMessage => {
              if (!message || typeof message !== "object") {
                return false;
              }

              const item = message as Record<string, unknown>;

              return (
                (item.role === "user" ||
                  item.role === "assistant") &&
                typeof item.content === "string"
              );
            }
          )
          .slice(-10)
      : [];

    if (!question) {
      return NextResponse.json(
        { message: "Question is required" },
        { status: 400 }
      );
    }

    let context = "";

    /*
     * DOCUMENT MODE
     *
     * Only search Pinecone when documents are selected.
     */
    if (documentIds.length > 0) {
      /*
       * Replace this section with your real Pinecone flow:
       *
       * const questionEmbedding =
       *   await createQuestionEmbedding(question);
       *
       * const matches = await searchPinecone({
       *   vector: questionEmbedding,
       *   documentIds,
       * });
       *
       * context = matches
       *   .map((match) => match.metadata?.text)
       *   .filter(Boolean)
       *   .join("\n\n");
       */

      context = `
        Temporary content from the selected documents.
        Replace this with the chunks returned from Pinecone.
      `;
    }

    /*
     * GENERAL MODE:
     * When documentIds is empty, context stays empty and Gemini
     * answers like a normal conversational assistant.
     */
    const answer = await generateAnswer({
      question,
      history,
      context,
    });

    return NextResponse.json({
      answer,
      mode: documentIds.length > 0 ? "document" : "general",
    });
  } catch (error) {
    console.error("Chat API error:", error);

    return NextResponse.json(
      { message: "Failed to generate answer" },
      { status: 500 }
    );
  }
}