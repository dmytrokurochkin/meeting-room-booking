import { NextResponse } from "next/server";
import { apiRoute } from "@/server/http";
import { requireSessionUser } from "@/server/session";
import {
  deliverPendingNotifications,
  generateDueNotifications,
} from "@/server/services/notifications.service";

export const GET = apiRoute(async () => {
  const user = await requireSessionUser();
  await generateDueNotifications(user.id);
  const notifications = await deliverPendingNotifications(user.id);
  return NextResponse.json({ notifications });
});
