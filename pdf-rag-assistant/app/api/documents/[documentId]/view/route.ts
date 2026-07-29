import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyToken } from "@/lib/jwt";

const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "documents";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const token = (await cookies()).get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id: userId } = verifyToken(token);
    const { documentId } = await params;
    const document = await prisma.document.findFirst({
      where: { id: documentId, userId },
      select: { fileUrl: true },
    });

    if (!document) {
      return NextResponse.json({ message: "Document not found" }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(document.fileUrl, 60 * 5);

    if (error || !data?.signedUrl) {
      throw new Error(error?.message ?? "Couldn't prepare the PDF preview");
    }

    return NextResponse.redirect(data.signedUrl);
  } catch (error) {
    console.error("Failed to open document preview:", error);
    return NextResponse.json(
      { message: "Couldn't open this PDF. Please try again." },
      { status: 500 }
    );
  }
}
