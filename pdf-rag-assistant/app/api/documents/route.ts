import { NextResponse } from "next/server";
import { createDocument } from "@/services/doc.service";
import { getDocuments } from "@/services/doc.service";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { supabase } from "@/lib/supabase";



export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();

const token = cookieStore.get("token")?.value;

if (!token) {
    return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
    );
}
const decoded = verifyToken(token);

const userId = decoded.id;
    const formData = await request.formData();

    const files = formData.getAll("files") as File[];
   

    if (files.length === 0) {
  return NextResponse.json(
    { message: "No file uploaded" },
    { status: 400 }
  );
}

const documents = [];

for (const file of files) {
  // Create a unique file name
  const fileName = `${Date.now()}-${file.name}`;

  // Upload to Supabase Storage
  const { error } = await supabase.storage
    .from("documents")
    .upload(fileName, file);

  if (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to upload file to Supabase" },
      { status: 500 }
    );
  }

  // Get the public URL
  const { data } = supabase.storage
    .from("documents")
    .getPublicUrl(fileName);

  // Save metadata to PostgreSQL
  const document = await createDocument({
    fileName: file.name,
    fileUrl: data.publicUrl,
    fileSize: file.size,
    status: "UPLOADED",
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
    const cookieStore = await cookies();

    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);

    const documents = await getDocuments(decoded.id);

    return NextResponse.json(documents);

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}