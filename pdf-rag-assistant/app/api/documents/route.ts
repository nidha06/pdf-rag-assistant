import { NextResponse } from "next/server";
import { createDocument } from "@/services/doc.service";
import { getDocuments } from "@/services/doc.service";
import { deleteDocument } from "@/services/doc.service";
import { requireUser } from "@/lib/auth";

function isPdfFile(file: File) {
  return (
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf")
  );
}


export async function POST(request: Request) {
  try {
    const currentUser = await requireUser();
    if (!currentUser) {
    return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
    );
}
    const userId = currentUser.id;
    const formData = await request.formData();

    const files = formData.getAll("files") as File[];
   

    if (files.length === 0) {
  return NextResponse.json(
    { message: "No file uploaded" },
    { status: 400 }
  );
}

const invalidFiles = files.filter((file) => !isPdfFile(file));

if (invalidFiles.length > 0) {
  return NextResponse.json(
    {
      message: "Only PDF files are supported",
      invalidFiles: invalidFiles.map((file) => file.name),
    },
    { status: 400 }
  );
}

const documents = [];

for (const file of files) {
  // createDocument uploads the file, creates the database row, and indexes it.
  const document = await createDocument({
    file,
    userId,
  });

  documents.push(document);
}



return NextResponse.json(documents);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Upload failed" },
      { status: 500 }
    );
  }
}


export async function GET() {
  try {
    const currentUser = await requireUser();
    if (!currentUser) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const documents = await getDocuments(currentUser.id);

    return NextResponse.json(documents);

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const currentUser = await requireUser();
    if (!currentUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const documentId = new URL(request.url).searchParams.get("id");

    if (!documentId) {
      return NextResponse.json({ message: "Document ID is required" }, { status: 400 });
    }

    await deleteDocument(documentId, currentUser.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Document delete error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to delete document" },
      { status: 500 }
    );
  }
}
