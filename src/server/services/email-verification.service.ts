import "server-only";
import { prisma } from "@/server/db";
import { ApiError } from "@/server/http";
import { generateToken, hashToken } from "@/server/tokens";

const TOKEN_DURATION_HOURS = 24;

/**
 * No real SMTP in dev: the confirmation link is printed to the server log
 * instead of emailed, per the spec's dev-mode email confirmation bonus.
 */
export async function createEmailVerificationToken(
  userId: string,
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + TOKEN_DURATION_HOURS * 60 * 60 * 1000);
  await prisma.emailVerificationToken.create({
    data: { id: hashToken(token), userId, expiresAt },
  });
  return { token, expiresAt };
}

export function logVerificationLink(email: string, token: string): void {
  // Deliberately not derived from the request's Host header: behind Docker's
  // standalone Next.js server that resolves to the container's own hostname,
  // not something reachable from outside the container.
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const link = `${appUrl}/verify-email?token=${token}`;
  console.log(`[email] Підтвердження email для ${email}: ${link}`);
}

export async function verifyEmailToken(token: string): Promise<void> {
  const record = await prisma.emailVerificationToken.findUnique({
    where: { id: hashToken(token) },
  });
  if (!record || record.expiresAt < new Date()) {
    throw new ApiError("INVALID_TOKEN", "Посилання недійсне або застаріле.");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date() },
    }),
    prisma.emailVerificationToken.deleteMany({ where: { userId: record.userId } }),
  ]);
}
