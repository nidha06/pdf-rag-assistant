import { getUser } from "@/services/user.service";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function GET(){
    try{
       const currentUser = await requireUser();
       if (!currentUser) {
        return NextResponse.json(null);
       }
       const user = await getUser(currentUser.id);
       return NextResponse.json(user);
    }catch{
       return NextResponse.json(null);
    }
}

export async function PATCH(request: Request) {
  try {
    const currentUser = await requireUser();
    if (!currentUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!name || name.length > 80) {
      return NextResponse.json(
        { message: "Display name must be between 1 and 80 characters" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: currentUser.id },
      data: { name },
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { message: "Failed to update profile" },
      { status: 500 }
    );
  }
}
