import { auth } from "@/auth";

export async function requireUser() {
  const session = await auth();
  const id = session?.user?.id;

  return typeof id === "string" ? { id } : null;
}
