import { apiRoute } from "@/server/http";
import { destroyCurrentSession } from "@/server/session";

export const POST = apiRoute(async () => {
  await destroyCurrentSession();
  return new Response(null, { status: 204 });
});
