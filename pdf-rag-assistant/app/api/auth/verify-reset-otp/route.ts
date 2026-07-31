import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createResetToken,
  hashResetValue,
  isEmail,
  matchesResetValue,
  normalizeEmail,
  RESET_OTP_MAX_ATTEMPTS,
} from "@/lib/password-reset";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = normalizeEmail(body?.email);
  const otp = typeof body?.otp === "string" ? body.otp.trim() : "";
  if (!isEmail(email) || !/^\d{6}$/.test(otp)) {
    return NextResponse.json({ message: "The verification code is invalid or expired." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  const reset = user && await prisma.passwordResetOtp.findFirst({
    where: { userId: user.id, usedAt: null, verifiedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!reset || reset.attempts >= RESET_OTP_MAX_ATTEMPTS) {
    if (reset) await prisma.passwordResetOtp.update({ where: { id: reset.id }, data: { usedAt: new Date() } });
    return NextResponse.json({ message: "The verification code is invalid or expired." }, { status: 400 });
  }

  if (!(await matchesResetValue(otp, reset.otpHash))) {
    const attempts = reset.attempts + 1;
    await prisma.passwordResetOtp.update({
      where: { id: reset.id },
      data: attempts >= RESET_OTP_MAX_ATTEMPTS ? { attempts, usedAt: new Date() } : { attempts },
    });
    return NextResponse.json({ message: "The verification code is invalid or expired." }, { status: 400 });
  }

  const resetToken = createResetToken();
  await prisma.passwordResetOtp.update({
    where: { id: reset.id },
    data: { verifiedAt: new Date(), resetTokenHash: await hashResetValue(resetToken) },
  });
  return NextResponse.json({ resetToken });
}
