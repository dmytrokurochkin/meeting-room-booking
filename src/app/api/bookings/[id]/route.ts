import { apiRoute } from "@/server/http";
import { requireSessionUser } from "@/server/session";
import { cancelBooking } from "@/server/services/bookings.service";

type RouteContext = { params: Promise<{ id: string }> };

export const DELETE = apiRoute(async (_request: Request, context: RouteContext) => {
  const user = await requireSessionUser();
  const { id } = await context.params;

  await cancelBooking(user.id, id);
  return new Response(null, { status: 204 });
});
