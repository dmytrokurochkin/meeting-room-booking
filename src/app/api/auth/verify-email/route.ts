import { NextResponse } from "next/server";
import { z } from "zod";
import { apiRoute, parseJsonBody } from "@/server/http";
import { verifyEmailToken } from "@/server/services/email-verification.service";

const verifyEmailSchema = z.object({ token: z.string().min(1) });

export const POST = apiRoute(async (request) => {
  const { token } = await parseJsonBody(request, verifyEmailSchema);
  await verifyEmailToken(token);
  return NextResponse.json({ ok: true });
});
