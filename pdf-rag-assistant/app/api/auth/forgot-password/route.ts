import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createOtp,
  hashResetValue,
  isEmail,
  normalizeEmail,
  RESET_OTP_TTL_MS,
  sendPasswordResetOtp,
} from "@/lib/password-reset";

const genericResponse = { message: "If that email can reset a password, we sent a verification code." };

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = normalizeEmail(body?.email);

  // Keep this response identical for unknown and OAuth-only accounts.
  if (!isEmail(email)) return NextResponse.json(genericResponse);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.password) return NextResponse.json(genericResponse);

  const newest = await prisma.passwordResetOtp.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (newest && Date.now() - newest.createdAt.getTime() < 60_000) {
    return NextResponse.json(genericResponse);
  }

  const otp = createOtp();
  const now = new Date();
  const reset = await prisma.$transaction(async (tx) => {
    await tx.passwordResetOtp.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: now },
    });
    return tx.passwordResetOtp.create({
      data: {
        userId: user.id,
        otpHash: await hashResetValue(otp),
        expiresAt: new Date(Date.now() + RESET_OTP_TTL_MS),
      },
    });
  });

  try {
    await sendPasswordResetOtp(email, otp);
  } catch (error) {
    await prisma.passwordResetOtp.update({ where: { id: reset.id }, data: { usedAt: new Date() } });
    console.error("Password reset email failed", error);
    return NextResponse.json({ message: "We could not send the verification email. Please try again later." }, { status: 503 });
  }

  return NextResponse.json(genericResponse);
}
