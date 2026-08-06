import { apiRoute } from "@/server/http";
import { requireSessionUser } from "@/server/session";
import { cancelBooking, type CancelScope } from "@/server/services/bookings.service";

type RouteContext = { params: Promise<{ id: string }> };

export const DELETE = apiRoute(async (request: Request, context: RouteContext) => {
  const user = await requireSessionUser();
  const { id } = await context.params;
  const scopeParam = new URL(request.url).searchParams.get("scope");
  const scope: CancelScope = scopeParam === "series" ? "series" : "single";

  await cancelBooking(user.id, id, scope);
  return new Response(null, { status: 204 });
});
