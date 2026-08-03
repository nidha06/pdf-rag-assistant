import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ chatId: string; messageId: string }> }
) {
  try {
    const currentUser = await requireUser();
    if (!currentUser) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { chatId, messageId } = await params;
    const body = await request.json().catch(() => null);
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    if (!content || content.length > 10_000) {
      return NextResponse.json({ message: "A message must contain between 1 and 10,000 characters." }, { status: 400 });
    }

    const message = await prisma.message.findFirst({
      where: { id: messageId, chatId, role: "user", chat: { userId: currentUser.id } },
      select: { id: true },
    });
    if (!message) return NextResponse.json({ message: "Message not found" }, { status: 404 });

    const updated = await prisma.message.update({
      where: { id: message.id },
      data: { content },
      select: { id: true, content: true, createdAt: true },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Message edit API error:", error);
    return NextResponse.json({ message: "Unable to save that edit. Please try again." }, { status: 500 });
  }
}
