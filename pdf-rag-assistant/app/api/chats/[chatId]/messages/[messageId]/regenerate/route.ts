import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { generateAnswer } from "@/services/gemini.service";
import { askSelectedDocuments } from "@/services/rag.service";
import { classifyIntent } from "@/services/intent-classifier.service";

type ChatHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

// Intent classification is handled by the classifyIntent service.

export async function POST(
  request: Request,
  { params }: { params: Promise<{ chatId: string; messageId: string }> }
) {
  const flowId = crypto.randomUUID();
  const startedAt = Date.now();

  try {
    const currentUser = await requireUser();
    if (!currentUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = currentUser.id;
    const { chatId, messageId } = await params;
    const body = await request.json().catch(() => null);
    const content =
      typeof body?.content === "string" ? body.content.trim() : "";

    if (!content || content.length > 10_000) {
      return NextResponse.json(
        {
          message:
            "A message must contain between 1 and 10,000 characters.",
        },
        { status: 400 }
      );
    }

    // Verify ownership: the chat belongs to this user and the message exists
    // as a user message inside that chat.
    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId },
      select: { id: true, documentIds: true },
    });
    if (!chat) {
      return NextResponse.json(
        { message: "Chat not found" },
        { status: 404 }
      );
    }

    const userMessage = await prisma.message.findFirst({
      where: { id: messageId, chatId: chat.id, role: "user" },
      select: { id: true, createdAt: true },
    });
    if (!userMessage) {
      return NextResponse.json(
        { message: "Message not found" },
        { status: 404 }
      );
    }

    console.info(`[regenerate:${flowId}] starting`, {
      chatId,
      messageId,
      contentLength: content.length,
    });

    // Update the user message text.
    await prisma.message.update({
      where: { id: userMessage.id },
      data: { content },
    });

    // Find the assistant message that immediately follows this user message.
    const nextAssistantMessage = await prisma.message.findFirst({
      where: {
        chatId: chat.id,
        role: "assistant",
        createdAt: { gte: userMessage.createdAt },
      },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    // Build conversation history from messages BEFORE the edited message.
    const priorMessages = await prisma.message.findMany({
      where: {
        chatId: chat.id,
        createdAt: { lt: userMessage.createdAt },
      },
      orderBy: { createdAt: "asc" },
      select: { role: true, content: true },
      take: 10,
    });

    const history: ChatHistoryMessage[] = priorMessages
      .filter(
        (m): m is typeof m & { role: "user" | "assistant" } =>
          m.role === "user" || m.role === "assistant"
      )
      .map((m) => ({ role: m.role, content: m.content }));

    // Re-generate the AI answer using the same logic as the main chat route.
    const documentIds = chat.documentIds ?? [];
    const intent = await classifyIntent({
      question: content,
      history,
      hasDocuments: documentIds.length > 0,
      flowId,
    });
    const useDocumentContext = intent === "document";

    let answer: string;
    let sources: Array<{
      id: string;
      fileName: string;
      pageNumber: number;
      score: number;
      excerpt: string;
    }> = [];

    if (useDocumentContext) {
      const result = await askSelectedDocuments({
        question: content,
        documentIds,
        userId,
        history,
        flowId,
      });
      answer =
        result.answer ?? "I couldn't generate an answer. Please try again.";
      sources = result.sources;
    } else {
      answer =
        (await generateAnswer({
          question: content,
          history,
          context: "",
          flowId,
        })) ?? "I couldn't generate an answer. Please try again.";
    }

    // Update or create the assistant message.
    let assistantMessageId: string;

    if (nextAssistantMessage) {
      await prisma.message.update({
        where: { id: nextAssistantMessage.id },
        data: { content: answer },
      });
      assistantMessageId = nextAssistantMessage.id;
    } else {
      const created = await prisma.message.create({
        data: { chatId: chat.id, role: "assistant", content: answer },
        select: { id: true },
      });
      assistantMessageId = created.id;
    }

    console.info(`[regenerate:${flowId}] complete`, {
      chatId,
      messageId,
      assistantMessageId,
      answerLength: answer.length,
      sourceCount: sources.length,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json({
      answer,
      sources,
      userMessageId: userMessage.id,
      assistantMessageId,
    });
  } catch (error) {
    console.error(`[regenerate:${flowId}] failed`, error);
    return NextResponse.json(
      { message: "Failed to regenerate answer. Please try again." },
      { status: 500 }
    );
  }
}
