import "server-only";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { documentIndex } from "@/lib/pinecone";
import {
  extractAndChunkPdf,
} from "./pdf-processing.service";
import {
  embedDocumentChunks,
} from "./embedding.service";

const PINECONE_BATCH_SIZE = 100;
const STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET ??
  "documents";

export async function indexDocument(
  documentId: string,
  userId: string
) {
  const trace = `[index:${documentId}]`;
  const startedAt = Date.now();
  const document =
    await prisma.document.findFirst({
      where: {
        id: documentId,
        userId,
      },
    });

  if (!document) {
    throw new Error("Document not found");
  }

  try {
    console.info(`${trace} indexing started`, {
      fileName: document.fileName,
      fileSize: document.fileSize,
    });
    await prisma.document.update({
      where: {
        id: document.id,
      },
      data: {
        status: "PROCESSING",
      },
    });

    /*
     * fileUrl must contain the Supabase object path.
     */
    const { data: fileBlob, error } =
      await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .download(document.fileUrl);

    if (error || !fileBlob) {
      throw new Error(
        error?.message ??
          "Could not download the PDF"
      );
    }

    console.info(`${trace} PDF downloaded`, { bytes: fileBlob.size });

    const pdfBytes = new Uint8Array(
      await fileBlob.arrayBuffer()
    );

    console.info(`${trace} extracting and chunking PDF`);
    const chunks = await extractAndChunkPdf(pdfBytes);
    console.info(`${trace} PDF chunking complete`, { chunkCount: chunks.length });

    console.info(`${trace} embedding document chunks`);
    const embeddings = await embedDocumentChunks(
      chunks.map((chunk) => chunk.content),
      document.fileName
    );
    console.info(`${trace} embeddings complete`, {
      embeddingCount: embeddings.length,
      dimensions: embeddings[0]?.length ?? 0,
    });

    const namespace =
      documentIndex.namespace(userId);

    const pineconeRecords = chunks.map(
      (chunk, index) => ({
        id: `${document.id}-${chunk.chunkIndex}`,

        values: embeddings[index],

        metadata: {
          documentId: document.id,
          fileName: document.fileName,
          chunkIndex: chunk.chunkIndex,
          pageNumber: chunk.pageNumber,
          text: chunk.content,
        },
      })
    );

    for (
      let start = 0;
      start < pineconeRecords.length;
      start += PINECONE_BATCH_SIZE
    ) {
      const batch = pineconeRecords.slice(
        start,
        start + PINECONE_BATCH_SIZE
      );

      console.info(`${trace} upserting Pinecone batch`, {
        batch: Math.floor(start / PINECONE_BATCH_SIZE) + 1,
        recordCount: batch.length,
      });
      await namespace.upsert({
        records: batch,
      });
    }

    /*
     * Store chunks in your existing
     * DocumentChunk table.
     */
    await prisma.$transaction([
      prisma.documentChunk.deleteMany({
        where: {
          documentId: document.id,
        },
      }),

      prisma.documentChunk.createMany({
        data: chunks.map((chunk, index) => ({
          content: chunk.content,
          embedding: embeddings[index],
          chunkIndex: chunk.chunkIndex,
          documentId: document.id,
        })),
      }),

      prisma.document.update({
        where: {
          id: document.id,
        },
        data: {
          status: "READY",
        },
      }),
    ]);

    console.info(`${trace} indexing complete`, {
      chunkCount: chunks.length,
      durationMs: Date.now() - startedAt,
    });

    return {
      documentId: document.id,
      chunkCount: chunks.length,
    };
  } catch (error) {
    console.error(`${trace} indexing failed`, error);
    await prisma.document.update({
      where: {
        id: document.id,
      },
      data: {
        status: "FAILED",
      },
    });

    throw error;
  }
}
