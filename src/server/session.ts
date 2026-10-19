import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { appEnv } from "../config/app";
import { Session, User } from "./db";

const COOKIE = "leela_session";

export function hashToken(token: string) {
  const pepper = appEnv().pepper;
  if (pepper.length < 16) throw new Error("AUTH_TOKEN_PEPPER is missing");
  return createHmac("sha256", pepper).update(token).digest("hex");
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function checkPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function passwordOk(password: string): boolean {
  if (password.length < 10 || password.length > 128) return false;
  const common = ["password123", "1234567890", "qwertyuiop", "letmeinplease"];
  return !common.includes(password.toLowerCase());
}

export async function openSession(userId: unknown, userAgent: string | null) {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  await Session.create({
    userId,
    tokenHash: hashToken(token),
    expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
    lastSeenAt: now,
    userAgent: userAgent?.slice(0, 200),
  });
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
}

export async function currentUser() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const session = await Session.findOne({ tokenHash: hashToken(token) });
  if (!session || session.expiresAt < new Date()) return null;
  const user = await User.findById(session.userId);
  if (!user) return null;
  if (session.lastSeenAt < user.passwordChangedAt) return null;
  const hour = 60 * 60 * 1000;
  if (Date.now() - session.lastSeenAt.getTime() > hour) {
    session.lastSeenAt = new Date();
    session.expiresAt = new Date(Date.now() + 30 * 24 * hour);
    await session.save();
  }
  return user;
}

export async function clearSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await Session.deleteOne({ tokenHash: hashToken(token) });
  jar.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export function sameHash(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
