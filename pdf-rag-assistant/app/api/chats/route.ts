import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function GET() {
  try {
    const currentUser = await requireUser();
    if (!currentUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const chats = await prisma.chat.findMany({
      where: { userId: currentUser.id },
      orderBy: { createAt: "desc" },
      select: { id: true, title: true, createAt: true },
      take: 20,
    });

    return NextResponse.json(chats);
  } catch (error) {
    console.error("Chat history API error:", error);
    return NextResponse.json(
      { message: "Failed to load chat history" },
      { status: 500 }
    );
  }
}
