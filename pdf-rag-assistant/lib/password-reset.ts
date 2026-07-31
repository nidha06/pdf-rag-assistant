import bcrypt from "bcrypt";
import crypto from "crypto";
import nodemailer from "nodemailer";

export const RESET_OTP_TTL_MS = 10 * 60 * 1000;
export const RESET_OTP_MAX_ATTEMPTS = 5;

export function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function createOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

export function createResetToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export async function hashResetValue(value: string) {
  return bcrypt.hash(value, 12);
}

export async function matchesResetValue(value: string, hash: string) {
  return bcrypt.compare(value, hash);
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const port = Number(process.env.SMTP_PORT ?? "587");

  if (!host || !user || !pass || !Number.isInteger(port)) {
    throw new Error("Email delivery is not configured");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendPasswordResetOtp(email: string, otp: string) {
  const from = process.env.EMAIL_FROM;
  if (!from) throw new Error("Email delivery is not configured");

  await getTransporter().sendMail({
    from,
    to: email,
    subject: "Your Docmind password reset code",
    text: `Your Docmind password reset code is ${otp}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
    html: `<p>Your Docmind password reset code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:4px">${otp}</p><p>It expires in 10 minutes. If you did not request this, you can ignore this email.</p>`,
  });
}
