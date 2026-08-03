import { NextResponse } from "next/server";
import { generateAnswer } from "@/services/gemini.service";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import {
  askSelectedDocuments,
} from "@/services/rag.service";
import { classifyIntent } from "@/services/intent-classifier.service";


type ChatHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

// Intent classification is now handled by the classifyIntent service
// which uses LLM-based classification for accurate routing.

function getRateLimitDetails(error: unknown) {
  if (!error || typeof error !== "object") return null;

  const candidate = error as {
    statusCode?: unknown;
    message?: unknown;
    error?: { message?: unknown; code?: unknown };
  };
  const message =
    typeof candidate.error?.message === "string"
      ? candidate.error.message
      : typeof candidate.message === "string"
        ? candidate.message
        : "";
  const isRateLimited =
    candidate.statusCode === 429 ||
    candidate.error?.code === "too_many_requests" ||
    /quota exceeded|rate limit/i.test(message);

  if (!isRateLimited) return null;

  const retryMatch = message.match(/retry in\s+([\d.]+)s/i);
  const retryAfterSeconds = retryMatch
    ? Math.ceil(Number(retryMatch[1]))
    : undefined;

  return { retryAfterSeconds };
}

export async function POST(request: Request) {
  const flowId = crypto.randomUUID();
  const startedAt = Date.now();

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

    console.info(`[chat:${flowId}] received`, {
      questionLength: question.length,
      selectedDocumentCount: documentIds.length,
      historyMessages: history.length,
    });

    if (!question) {
      return NextResponse.json(
        { message: "Question is required" },
        { status: 400 }
      );
    }

    // Document chat is user-scoped, so authenticate before querying the
    // database or using the user's Pinecone namespace.
    const currentUser = await requireUser();
    if (!currentUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const userId = currentUser.id;
    const intent = await classifyIntent({
      question,
      history,
      hasDocuments: documentIds.length > 0,
      flowId,
    });
    const useDocumentContext = intent === "document";
    console.info(`[chat:${flowId}] authenticated`, {
      userId,
      mode: useDocumentContext ? "document" : "general",
      classifiedIntent: intent,
    });
    const requestedChatId =
      typeof body.chatId === "string" ? body.chatId : undefined;

    const existingChat = requestedChatId
      ? await prisma.chat.findFirst({
        where: { id: requestedChatId, userId },
        select: { id: true },
      })
      : null;

    let answer: string;
    let sources: Array<{
      id: string;
      fileName: string;
      pageNumber: number;
      score: number;
      excerpt: string;
    }> = [];
    let mode: "general" | "document" = "general";

    if (useDocumentContext) {
      const selectedDocuments = await prisma.document.findMany({
        where: {
          id: { in: documentIds },
          userId,
          status: "READY",
        },
        select: { id: true },
      });

      if (selectedDocuments.length !== documentIds.length) {
        console.warn(`[chat:${flowId}] unavailable document selection`, {
          requested: documentIds.length,
          available: selectedDocuments.length,
        });
        return NextResponse.json(
          {
            message:
              "One or more selected documents are unavailable or still processing",
          },
          { status: 400 }
        );
      }

      console.info(`[chat:${flowId}] document scope verified`, {
        documentCount: selectedDocuments.length,
      });

      const result = await askSelectedDocuments({
        question,
        documentIds,
        userId,
        history,
        flowId,
      });

      answer = result.answer ?? "I couldn't generate an answer. Please try again.";
      sources = result.sources;
      mode = "document";
    } else {
      if (documentIds.length > 0) {
        console.info(`[chat:${flowId}] casual message bypassed document retrieval`);
      }
      console.info(`[chat:${flowId}] starting general answer generation`);
      answer =
        (await generateAnswer({ question, history, context: "", flowId })) ??
        "I couldn't generate an answer. Please try again.";
    }

    const chat = existingChat
      ? documentIds.length > 0
        ? await prisma.chat.update({
          where: { id: existingChat.id },
          data: { documentIds },
          select: { id: true },
        })
        : existingChat
      : await prisma.chat.create({
        data: {
          userId,
          title: question.slice(0, 60),
          documentIds,
        },
        select: { id: true },
      });

    const [userMessage, assistantMessage] = await prisma.$transaction([
      prisma.message.create({
        data: { chatId: chat.id, role: "user", content: question },
        select: { id: true },
      }),
      prisma.message.create({
        data: { chatId: chat.id, role: "assistant", content: answer },
        select: { id: true },
      }),
    ]);

    console.info(`[chat:${flowId}] complete`, {
      chatId: chat.id,
      mode,
      answerLength: answer.length,
      sourceCount: sources.length,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json({
      answer,
      sources,
      mode,
      chatId: chat.id,
      userMessageId: userMessage.id,
      assistantMessageId: assistantMessage.id,
    });
  } catch (error) {
    console.error(`[chat:${flowId}] failed`, error);

    const rateLimit = getRateLimitDetails(error);

    if (rateLimit) {
      const retryMessage = rateLimit.retryAfterSeconds
        ? `The AI request limit has been reached. Please try again in about ${rateLimit.retryAfterSeconds} seconds.`
        : "The AI request limit has been reached. Please wait a moment and try again.";

      return NextResponse.json(
        {
          message: retryMessage,
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { message: "Failed to generate answer" },
      { status: 500 }
    );
  }
}

