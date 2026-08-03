import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createOtp,
  hashResetValue,
  isEmail,
  normalizeEmail,
  sendSignupOtp,
  SIGNUP_OTP_TTL_MS,
} from "@/lib/password-reset";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const email = normalizeEmail(body?.email);

    if (!isEmail(email)) {
      return NextResponse.json(
        { message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Block signup if the email is already registered.
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existingUser) {
      return NextResponse.json(
        { message: "This email is already registered. Try signing in instead." },
        { status: 409 }
      );
    }

    // Rate limit: max 1 OTP per email per 60 seconds.
    const newest = await prisma.signupOtp.findFirst({
      where: { email },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    if (newest && Date.now() - newest.createdAt.getTime() < 60_000) {
      return NextResponse.json(
        { message: "A verification code was already sent. Please wait a moment before requesting a new one." },
        { status: 429 }
      );
    }

    // Generate OTP, invalidate any previous ones, and store the new one.
    const otp = createOtp();
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.signupOtp.updateMany({
        where: { email, usedAt: null },
        data: { usedAt: now },
      });
      await tx.signupOtp.create({
        data: {
          email,
          otpHash: await hashResetValue(otp),
          expiresAt: new Date(Date.now() + SIGNUP_OTP_TTL_MS),
        },
      });
    });

    // Send the verification email.
    try {
      await sendSignupOtp(email, otp);
    } catch (mailError) {
      // Invalidate the OTP if the email couldn't be sent.
      await prisma.signupOtp.updateMany({
        where: { email, usedAt: null },
        data: { usedAt: new Date() },
      });
      console.error("Signup OTP email failed", mailError);
      return NextResponse.json(
        { message: "We couldn't send a verification email. Please check the email address and try again." },
        { status: 503 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send signup OTP failed", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
