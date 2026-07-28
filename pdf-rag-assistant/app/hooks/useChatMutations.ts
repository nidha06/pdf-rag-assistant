import { useMutation } from "@tanstack/react-query";
import axios from "axios";

type ChatHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

type SendMessageData = {
  question: string;
  documentIds: string[];
  history: ChatHistoryMessage[];
};

type SendMessageResponse = {
  answer: string;
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