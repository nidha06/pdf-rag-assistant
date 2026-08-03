
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  isEmail,
  matchesResetValue,
  normalizeEmail,
  SIGNUP_OTP_MAX_ATTEMPTS,
} from "@/lib/password-reset";
import bcrypt from "bcrypt";

type SignupBody = {
  name: string;
  email: string;
  password: string;
  otp: string;
};

export async function POST(request: Request) {
  try {
    console.log("reached to signup route");
    const body: SignupBody = await request.json();
    const { name, password } = body;
    const email = normalizeEmail(body.email);
    const otp = typeof body.otp === "string" ? body.otp.trim() : "";

    // ── Validate inputs ────────────────────────────────────────────────
    if (!name?.trim()) {
      return NextResponse.json(
        { message: "Name is required." },
        { status: 400 }
      );
    }
    if (!isEmail(email)) {
      return NextResponse.json(
        { message: "Please enter a valid email address." },
        { status: 400 }
      );
    }
    if (!password || password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }
    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { message: "Please enter the 6-digit verification code sent to your email." },
        { status: 400 }
      );
    }

    // ── Check if user already exists ───────────────────────────────────
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 409 }
      );
    }

    // ── Verify the OTP ─────────────────────────────────────────────────
    const otpRecord = await prisma.signupOtp.findFirst({
      where: {
        email,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord || otpRecord.attempts >= SIGNUP_OTP_MAX_ATTEMPTS) {
      if (otpRecord) {
        await prisma.signupOtp.update({
          where: { id: otpRecord.id },
          data: { usedAt: new Date() },
        });
      }
      return NextResponse.json(
        { message: "The verification code is invalid or expired. Please request a new one." },
        { status: 400 }
      );
    }

    const otpMatches = await matchesResetValue(otp, otpRecord.otpHash);
    if (!otpMatches) {
      const attempts = otpRecord.attempts + 1;
      await prisma.signupOtp.update({
        where: { id: otpRecord.id },
        data:
          attempts >= SIGNUP_OTP_MAX_ATTEMPTS
            ? { attempts, usedAt: new Date() }
            : { attempts },
      });

      const remaining = SIGNUP_OTP_MAX_ATTEMPTS - attempts;
      return NextResponse.json(
        {
          message:
            remaining > 0
              ? `Incorrect verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
              : "Too many incorrect attempts. Please request a new verification code.",
        },
        { status: 400 }
      );
    }

    // ── OTP verified — create the user ─────────────────────────────────
    const hashedPassword = await bcrypt.hash(password, 10);

    const [user] = await prisma.$transaction([
      prisma.user.create({
        data: {
          name: name.trim(),
          email,
          password: hashedPassword,
          emailVerified: new Date(),
        },
      }),
      prisma.signupOtp.update({
        where: { id: otpRecord.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarSeed: user.avatarSeed,
        hasDocuments: false,
      },
    });
  } catch (error) {
    console.error("Signup failed:", error);
    const message =
      error instanceof Error ? error.message : "Signup failed";
    const databaseUnavailable =
      /can't reach database server|database.*not.*reachable/i.test(message);
    const status = databaseUnavailable
      ? 503
      : message === "User already exists"
        ? 409
        : 400;

    return NextResponse.json(
      {
        message: databaseUnavailable
          ? "The database is unavailable. Please try again shortly."
          : message,
      },
      { status }
    );
  }
}
