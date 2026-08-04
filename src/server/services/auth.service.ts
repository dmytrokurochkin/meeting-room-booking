import "server-only";
import { prisma } from "@/server/db";
import { ApiError } from "@/server/http";
import { hashPassword, verifyPassword } from "@/server/password";
import type { LoginInput, RegisterInput } from "@/shared/schemas";
import type { User } from "@/generated/prisma/client";

export async function registerUser(input: RegisterInput): Promise<User> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ApiError("EMAIL_TAKEN", "Ця email-адреса вже зареєстрована.", {
      email: "Ця email-адреса вже зареєстрована.",
    });
  }

  const passwordHash = await hashPassword(input.password);
  return prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash },
  });
}

export async function authenticateUser(input: LoginInput): Promise<User> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  const invalidCredentials = () =>
    new ApiError("INVALID_CREDENTIALS", "Неправильний email або пароль.");

  if (!user) throw invalidCredentials();

  const passwordMatches = await verifyPassword(input.password, user.passwordHash);
  if (!passwordMatches) throw invalidCredentials();

  return user;
}

export function toPublicUser(user: User) {
  return { id: user.id, name: user.name, email: user.email };
}
