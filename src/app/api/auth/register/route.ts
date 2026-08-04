import { NextResponse } from "next/server";
import { apiRoute, parseJsonBody } from "@/server/http";
import { registerSchema } from "@/shared/schemas";
import { registerUser, toPublicUser } from "@/server/services/auth.service";
import { createSession, setSessionCookie } from "@/server/session";

export const POST = apiRoute(async (request) => {
  const input = await parseJsonBody(request, registerSchema);
  const user = await registerUser(input);

  const { token, expiresAt } = await createSession(user.id);
  await setSessionCookie(token, expiresAt);

  return NextResponse.json({ user: toPublicUser(user) }, { status: 201 });
});
