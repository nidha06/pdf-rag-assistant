import { NextResponse } from "next/server";

// Credentials sign-in is handled by Auth.js at /api/auth/callback/credentials.
// Keep this endpoint temporarily so clients on older builds receive an explicit
// migration response instead of a silent 404.
export async function POST() {
  return NextResponse.json(
    { message: "Use the Auth.js credentials sign-in endpoint." },
    { status: 410 }
  );
}
