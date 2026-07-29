import "server-only";
import { withGeminiFailover } from "@/lib/gemini";

const EMBEDDING_DIMENSION = 3072;
const BATCH_SIZE = 20;

async function embedTexts(
  texts: string[]
): Promise<number[][]> {
  const response = await withGeminiFailover((client) =>
    client.models.embedContent({
      model:
        process.env.GEMINI_EMBEDDING_MODEL ??
        "gemini-embedding-2",

      contents: texts.map((text) => ({
        parts: [{ text }],
      })),

      config: {
        outputDimensionality: EMBEDDING_DIMENSION,
      },
    })
  );

  const embeddings = response.embeddings ?? [];

  if (embeddings.length !== texts.length) {
    throw new Error(
      "Gemini returned an unexpected number of embeddings"
    );
  }

  return embeddings.map((embedding) => {
    const values = embedding.values;

    if (
      !values ||
      values.length !== EMBEDDING_DIMENSION
    ) {
      throw new Error(
        "Gemini returned an invalid embedding"
      );
    }

    return values;
  });
}

export async function embedDocumentChunks(
  chunks: string[],
  documentName: string
): Promise<number[][]> {
  const startedAt = Date.now();
  const preparedChunks = chunks.map(
    (content) =>
      `title: ${documentName} | text: ${content}`
  );

  const embeddings: number[][] = [];

  for (
    let start = 0;
    start < preparedChunks.length;
    start += BATCH_SIZE
  ) {
    const batch = preparedChunks.slice(
      start,
      start + BATCH_SIZE
    );

    console.info("[embedding] document batch started", {
      documentName,
      batch: Math.floor(start / BATCH_SIZE) + 1,
      chunkCount: batch.length,
    });
    const result = await embedTexts(batch);
    embeddings.push(...result);
  }

  console.info("[embedding] document complete", {
    documentName,
    chunkCount: embeddings.length,
    durationMs: Date.now() - startedAt,
  });

  return embeddings;
}

export async function embedQuestion(
  question: string
): Promise<number[]> {
  const startedAt = Date.now();
  const preparedQuestion =
    `task: question answering | query: ${question}`;

  const [embedding] = await embedTexts([
    preparedQuestion,
  ]);

  console.info("[embedding] question complete", {
    questionLength: question.length,
    dimensions: embedding.length,
    durationMs: Date.now() - startedAt,
  });

  return embedding;
}
