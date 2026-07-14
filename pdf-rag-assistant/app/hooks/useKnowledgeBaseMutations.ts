"use client";

import { useMutation } from "@tanstack/react-query";

/**
 * useUploadFilesMutation — the network side of the knowledge-base
 * upload step. The page keeps the file list in local React state
 * (it's just a staging area before upload); this hook owns sending
 * that batch of files to the backend when the person hits continue.
 */

type UploadPayload = {
  files: File[];
};

async function uploadFilesRequest(payload: UploadPayload) {
  // Replace with your real endpoint, e.g.:
  // const formData = new FormData();
  // payload.files.forEach((f) => formData.append("files", f));
  // const res = await fetch("/api/knowledge-base/upload", {
  //   method: "POST",
  //   body: formData,
  // });
  // if (!res.ok) throw new Error("Upload failed.");
  // return res.json();
  await new Promise((resolve) => setTimeout(resolve, 900));
  return { ok: true };
}

export function useUploadFilesMutation() {
  return useMutation({
    mutationFn: uploadFilesRequest,
  });
}