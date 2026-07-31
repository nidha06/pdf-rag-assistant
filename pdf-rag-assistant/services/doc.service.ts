import "server-only";

import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { indexDocument } from "@/services/document-indexing.service";
import { documentIndex } from "@/lib/pinecone";

const STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET ?? "documents";

type CreateDocumentData = {
  file: File;
  userId: string;
};

export async function createDocument({
  file,
  userId,
}: CreateDocumentData) {
  if (!file) {
    throw new Error("File is required");
  }

  if (!userId) {
    throw new Error("User ID is required");
  }

  if (
    file.type !== "application/pdf" &&
    !file.name.toLowerCase().endsWith(".pdf")
  ) {
    throw new Error("Only PDF files are supported");
  }

  /*
   * Convert unsafe filename characters into underscores.
   */
  const safeFileName = file.name.replace(
    /[^a-zA-Z0-9._-]/g,
    "_"
  );

  /*
   * This is the path that will be stored in Supabase Storage.
   */
  const storagePath =
    `${userId}/${randomUUID()}-${safeFileName}`;

  /*
   * 1. Upload PDF to Supabase Storage.
   */
  const { error: uploadError } =
    await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

  if (uploadError) {
    throw new Error(
      `Supabase upload failed: ${uploadError.message}`
    );
  }

  /*
   * 2. Create the Document row.
   *
   * fileUrl stores the Storage object path,
   * not a public URL.
   */
  const document =
    await prisma.document.create({
      data: {
        fileName: file.name,
        fileUrl: storagePath,
        fileSize: file.size,
        status: "PROCESSING",
        userId,
      },
    });

  /*
   * 3. Extract, chunk, embed and save in Pinecone.
   */
  try {
    await indexDocument(
      document.id,
      userId
    );
  } catch (error) {
    console.error(
      `Failed to index document ${document.id}:`,
      error
    );

    /*
     * indexDocument should already change the
     * status to FAILED.
     */
    throw error;
  }

  /*
   * 4. Return the updated document.
   */
  return prisma.document.findUniqueOrThrow({
    where: {
      id: document.id,
    },
  });
}

export async function getDocuments(
  userId: string
) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  return prisma.document.findMany({
    where: {
      userId,
    },
    orderBy: {
      uploadedAt: "desc",
    },
  });
}

export async function deleteDocument(documentId: string, userId: string) {
  const document = await prisma.document.findFirst({
    where: { id: documentId, userId },
    select: {
      id: true,
      fileUrl: true,
      chunks: { select: { chunkIndex: true } },
    },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  const vectorIds = document.chunks.map(
    (chunk) => `${document.id}-${chunk.chunkIndex}`
  );

  if (vectorIds.length > 0) {
    await documentIndex.namespace(userId).deleteMany({ ids: vectorIds });
  }

  const { error: storageError } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .remove([document.fileUrl]);

  if (storageError) {
    throw new Error(`Storage delete failed: ${storageError.message}`);
  }

  await prisma.$transaction([
    prisma.documentChunk.deleteMany({ where: { documentId: document.id } }),
    prisma.document.delete({ where: { id: document.id } }),
    // Chats store document IDs as an array to retain their scope between
    // sessions. Remove the deleted ID so opening an older chat cannot surface
    // or try to query a document that no longer exists.
    prisma.$executeRaw`
      UPDATE "Chat"
      SET "documentIds" = array_remove("documentIds", ${document.id})
      WHERE "userId" = ${userId}
        AND ${document.id} = ANY("documentIds")
    `,
  ]);
}
