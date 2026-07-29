import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

export async function GET() {
  try {
    const token = (await cookies()).get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id: userId } = verifyToken(token);
    const chats = await prisma.chat.findMany({
      where: { userId },
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
