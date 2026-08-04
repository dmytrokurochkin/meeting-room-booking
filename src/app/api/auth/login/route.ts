import { NextResponse } from "next/server";
import { apiRoute, parseJsonBody } from "@/server/http";
import { loginSchema } from "@/shared/schemas";
import { authenticateUser, toPublicUser } from "@/server/services/auth.service";
import { createSession, setSessionCookie } from "@/server/session";

export const POST = apiRoute(async (request) => {
  const input = await parseJsonBody(request, loginSchema);
  const user = await authenticateUser(input);

  const { token, expiresAt } = await createSession(user.id);
  await setSessionCookie(token, expiresAt);

  return NextResponse.json({ user: toPublicUser(user) });
});
