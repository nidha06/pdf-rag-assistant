import "server-only";
import { Pinecone } from "@pinecone-database/pinecone";

if (!process.env.PINECONE_API_KEY) {
  throw new Error("PINECONE_API_KEY is missing");
}

if (!process.env.PINECONE_INDEX_NAME) {
  throw new Error("PINECONE_INDEX_NAME is missing");
}

export const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

export const documentIndex = pinecone.index(
  process.env.PINECONE_INDEX_NAME
);