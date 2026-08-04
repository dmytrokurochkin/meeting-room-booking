import { NextResponse } from "next/server";
import { apiRoute } from "@/server/http";
import { getSessionUser } from "@/server/session";
import { toPublicUser } from "@/server/services/auth.service";

export const GET = apiRoute(async () => {
  const user = await getSessionUser();
  return NextResponse.json({ user: user ? toPublicUser(user) : null });
});
