import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";


type SendMessageData = {
  question: string;
  documentIds: string[];
  history: ChatHistoryMessage[];
  chatId?: string;
};

export type AnswerSource = {
  id: string;
  fileName: string;
  pageNumber: number;
  score: number;
  excerpt: string;
};

type SendMessageResponse = {
  answer: string;
  chatId: string;
  sources: AnswerSource[];
};

async function sendMessageRequest(
  data: SendMessageData
): Promise<SendMessageResponse> {
  const response = await axios.post<SendMessageResponse>(
    "/api/chat",
    data
  );

  return response.data;
}

export function useSendMessageMutation() {
  return useMutation({
    mutationFn: sendMessageRequest,
  });
}

export type ChatHistoryItem = {
  id: string;
  title: string;
  createAt: string;
};

async function getChatHistoryRequest(): Promise<ChatHistoryItem[]> {
  const response = await axios.get<ChatHistoryItem[]>("/api/chats");
  return response.data;
}

export function useChatHistory() {
  return useQuery({
    queryKey: ["chat-history"],
    queryFn: getChatHistoryRequest,
  });
}

export type ChatHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};
