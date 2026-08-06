import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/server/db";
import { ApiError } from "@/server/http";
import { generateToken, hashToken } from "@/server/tokens";
import type { User } from "@/generated/prisma/client";

export const SESSION_COOKIE_NAME = "sid";
const SESSION_DURATION_DAYS = 30;

export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { id: hashToken(token), userId, expiresAt } });
  return { token, expiresAt };
}

export async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    // `secure` cookies are only stored over HTTPS (browsers special-case "localhost",
    // but nothing else). This deployment has no TLS termination anywhere, docker compose
    // just serves plain HTTP, so gating this on NODE_ENV silently dropped the session
    // cookie for anyone opening the app via a LAN/VPN IP instead of localhost.
    secure: false,
    expires: expiresAt,
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}

export async function getSessionUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { id: hashToken(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) return null;

  return session.user;
}

export async function requireSessionUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) throw new ApiError("UNAUTHENTICATED", "Увійдіть, щоб продовжити.");
  return user;
}

export async function destroyCurrentSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.delete({ where: { id: hashToken(token) } }).catch(() => {});
  }
  store.delete(SESSION_COOKIE_NAME);
}
