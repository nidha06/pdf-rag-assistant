import { verifyToken } from "@/lib/jwt";
import { getUser } from "@/services/user.service";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(){
    try{
       const cookieStore = await cookies();
       const token = cookieStore.get("token")?.value;

       if(!token){
        return NextResponse.json(null);
       }

       const decoded = verifyToken(token);
       
       const user = await getUser(decoded.id);
       return NextResponse.json(user);
    }catch(error){
       return NextResponse.json(null);
    }
}

export async function PATCH(request: Request) {
  try {
    const token = (await cookies()).get("token")?.value;

    if (!token) {
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

    const { id } = verifyToken(token);
    const user = await prisma.user.update({
      where: { id },
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
