import axios from "axios";

type AskQuestionData = {
  question: string;
  documentIds: string[];
};

export async function askQuestionRequest(data: AskQuestionData) {
  const response = await axios.post("/api/chat", data);
  return response.data;
}