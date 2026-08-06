import { NextResponse } from "next/server";
import { apiRoute } from "@/server/http";
import { requireSessionUser } from "@/server/session";
import { listRoomsWithAvailability } from "@/server/services/rooms.service";

export const GET = apiRoute(async (request) => {
  await requireSessionUser();

  const minCapacityParam = new URL(request.url).searchParams.get("minCapacity");
  const minCapacity = minCapacityParam ? Number(minCapacityParam) : undefined;

  const rooms = await listRoomsWithAvailability(Number.isFinite(minCapacity) ? minCapacity : undefined);
  return NextResponse.json({ rooms });
});
