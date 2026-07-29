import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export function generateToken(payload: {
  id: string;
  email: string;
}) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "7d",
  });
}

export type AuthTokenPayload = JwtPayload & {
  id: string;
  email: string;
};

export function verifyToken(token: string): AuthTokenPayload {
  const payload = jwt.verify(token, JWT_SECRET);

  if (
    typeof payload === "string" ||
    typeof payload.id !== "string" ||
    typeof payload.email !== "string"
  ) {
    throw new Error("Invalid authentication token");
  }

  return payload as AuthTokenPayload;
}
