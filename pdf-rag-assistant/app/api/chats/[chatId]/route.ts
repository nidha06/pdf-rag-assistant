import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const token = (await cookies()).get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id: userId } = verifyToken(token);
    const { chatId } = await params;
    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId },
      select: {
        id: true,
        title: true,
        documentIds: true,
        messages: {
          orderBy: { createdAt: "asc" },
          select: { id: true, role: true, content: true, createdAt: true },
        },
      },
    });

    if (!chat) {
      return NextResponse.json({ message: "Chat not found" }, { status: 404 });
    }

    return NextResponse.json(chat);
  } catch (error) {
    console.error("Chat detail API error:", error);
    return NextResponse.json(
      { message: "Failed to load chat" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const token = (await cookies()).get("token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id: userId } = verifyToken(token);
    const { chatId } = await params;
    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";

    if (!title || title.length > 100) {
      return NextResponse.json(
        { message: "Conversation name must be between 1 and 100 characters" },
        { status: 400 }
      );
    }

    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId },
      select: { id: true },
    });
    if (!chat) {
      return NextResponse.json({ message: "Chat not found" }, { status: 404 });
    }

    const updatedChat = await prisma.chat.update({
      where: { id: chat.id },
      data: { title },
      select: { id: true, title: true, createAt: true },
    });

    return NextResponse.json(updatedChat);
  } catch (error) {
    console.error("Chat rename API error:", error);
    return NextResponse.json({ message: "Failed to rename chat" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const token = (await cookies()).get("token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id: userId } = verifyToken(token);
    const { chatId } = await params;
    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId },
      select: { id: true },
    });
    if (!chat) {
      return NextResponse.json({ message: "Chat not found" }, { status: 404 });
    }

    await prisma.chat.delete({ where: { id: chat.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Chat delete API error:", error);
    return NextResponse.json({ message: "Failed to delete chat" }, { status: 500 });
  }
}
