    "use client";

    import { useMutation, useQuery } from "@tanstack/react-query";
    import axios from "axios";

    export const uploadFilesRequest = async (data: { files: File[] }) => {
    const formData = new FormData();

    data.files.forEach((file: File) => {
        formData.append("files", file);
    });

    const response = await axios.post("/api/documents", formData, {
        headers: {
        "Content-Type": "multipart/form-data",
        },
    });

    return response.data;
    };


    export async function getDocumentRequest(){
        const respones = await axios.get("/api/documents")

        return respones.data;
    }

    export function useUploadFilesMutation(){
    return useMutation({
        mutationFn: uploadFilesRequest,
    })
    }

export function useDocuments(){
        return useQuery({
            queryKey:["documents"],
            queryFn:getDocumentRequest,
    })
    }

export async function deleteDocumentRequest(documentId: string) {
    await axios.delete("/api/documents", { params: { id: documentId } });
}

export function useDeleteDocumentMutation() {
    return useMutation({ mutationFn: deleteDocumentRequest });
}
