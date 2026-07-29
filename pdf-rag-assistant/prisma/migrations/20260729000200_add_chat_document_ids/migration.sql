-- Preserve the document scope of a conversation so follow-up questions can
-- keep using the same PDFs after a reload or when opening chat history.
ALTER TABLE "Chat"
ADD COLUMN "documentIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
