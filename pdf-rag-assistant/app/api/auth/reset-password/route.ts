import bcrypt from "bcrypt";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isEmail, matchesResetValue, normalizeEmail } from "@/lib/password-reset";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = normalizeEmail(body?.email);
  const password = typeof body?.password === "string" ? body.password : "";
  const resetToken = typeof body?.resetToken === "string" ? body.resetToken : "";
  if (!isEmail(email) || password.length < 8 || password.length > 128 || !resetToken) {
    return NextResponse.json({ message: "The reset request is invalid." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, password: true } });
  const reset = user && await prisma.passwordResetOtp.findFirst({
    where: { userId: user.id, usedAt: null, verifiedAt: { not: null }, expiresAt: { gt: new Date() }, resetTokenHash: { not: null } },
    orderBy: { createdAt: "desc" },
  });
  if (!user?.password || !reset?.resetTokenHash || !(await matchesResetValue(resetToken, reset.resetTokenHash))) {
    return NextResponse.json({ message: "Your reset session has expired. Request a new code." }, { status: 400 });
  }
  if (await bcrypt.compare(password, user.password)) {
    return NextResponse.json({ message: "Choose a password different from your current one." }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { password: await bcrypt.hash(password, 12), sessionVersion: { increment: 1 } },
    }),
    prisma.passwordResetOtp.update({
      where: { id: reset.id },
      data: { usedAt: new Date(), resetTokenHash: null },
    }),
  ]);

  return NextResponse.json({ message: "Your password has been updated. Please sign in again." });
}
