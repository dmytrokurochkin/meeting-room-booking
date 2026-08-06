import { NextResponse } from "next/server";
import { apiRoute } from "@/server/http";
import { requireSessionUser } from "@/server/session";
import {
  createEmailVerificationToken,
  logVerificationLink,
} from "@/server/services/email-verification.service";

export const POST = apiRoute(async () => {
  const user = await requireSessionUser();

  if (!user.emailVerifiedAt) {
    const { token } = await createEmailVerificationToken(user.id);
    logVerificationLink(user.email, token);
  }

  return NextResponse.json({ ok: true });
});
