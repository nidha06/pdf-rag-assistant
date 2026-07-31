import { NextResponse } from "next/server";

// Sign-out is handled by Auth.js at /api/auth/signout.
export async function POST() {
  return NextResponse.json(
    { message: "Use the Auth.js sign-out endpoint." },
    { status: 410 }
  );
}
