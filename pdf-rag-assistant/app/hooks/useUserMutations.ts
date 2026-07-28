import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export async function getCurrentUserRequest() {
  const respones = await axios.get("/api/auth/me");
console.log("getCurrentUserReq", respones.data)
  return respones.data;
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUserRequest,
  });
}
