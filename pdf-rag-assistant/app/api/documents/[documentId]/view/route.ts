import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireUser } from "@/lib/auth";

const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "documents";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const currentUser = await requireUser();
    if (!currentUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = currentUser.id;
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

    // Append #page=N so the browser's PDF viewer jumps to the cited page.
    const url = new URL(request.url);
    const page = url.searchParams.get("page");
    const fragment = page ? `#page=${page}` : "";

    return NextResponse.redirect(data.signedUrl + fragment);
  } catch (error) {
    console.error("Failed to open document preview:", error);
    return NextResponse.json(
      { message: "Couldn't open this PDF. Please try again." },
      { status: 500 }
    );
  }
}
