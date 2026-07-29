import "server-only";
import { PDFParse } from "pdf-parse";
import { getData as getPdfWorkerData } from "pdf-parse/worker";
import Tesseract from "tesseract.js";

// Use pdf-parse's bundled worker so PDF.js can render scanned pages on the
// server for the OCR fallback.
PDFParse.setWorker(getPdfWorkerData());

export type TextChunk = {
  content: string;
  chunkIndex: number;
  pageNumber: number;
};

function appendTextChunks(
  text: string,
  pageNumber: number,
  chunks: TextChunk[]
) {
  const cleanedText = text.replace(/\s+/g, " ").trim();
  if (!cleanedText) return;

  const words = cleanedText.split(/\s+/);
  const chunkSize = 300;
  const overlap = 60;
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + chunkSize, words.length);
    const content = words.slice(start, end).join(" ").trim();

    if (content) {
      chunks.push({
        content,
        chunkIndex: chunks.length,
        pageNumber,
      });
    }

    if (end === words.length) break;
    start = end - overlap;
  }
}

export async function extractAndChunkPdf(
  pdfBytes: Uint8Array
): Promise<TextChunk[]> {
  const startedAt = Date.now();
  const parser = new PDFParse({
    data: pdfBytes,
  });

  try {
    const result = await parser.getText();

    const chunks: TextChunk[] = [];

    for (const page of result.pages) {
      appendTextChunks(page.text, page.num, chunks);
    }

    console.info("[pdf] text extraction complete", {
      pageCount: result.pages.length,
      chunkCount: chunks.length,
    });

    if (chunks.length === 0) {
      console.info("[pdf] no embedded text found; starting OCR fallback");
      const screenshots = await parser.getScreenshot({
        scale: 1.5,
        imageBuffer: true,
        imageDataUrl: false,
      });

      for (const page of screenshots.pages) {
        console.info("[pdf] OCR page started", { pageNumber: page.pageNumber });
        const ocrResult = await Tesseract.recognize(
          Buffer.from(page.data),
          "eng"
        );
        appendTextChunks(ocrResult.data.text, page.pageNumber, chunks);
      }

      console.info("[pdf] OCR fallback complete", {
        pageCount: screenshots.pages.length,
        chunkCount: chunks.length,
      });
    }

    console.info("[pdf] PDF processing complete", {
      chunkCount: chunks.length,
      durationMs: Date.now() - startedAt,
    });

    if (chunks.length === 0) {
      throw new Error(
        "No readable text was found. This PDF may be scanned and require OCR."
      );
    }

    return chunks;
  } finally {
    await parser.destroy();
  }
}
