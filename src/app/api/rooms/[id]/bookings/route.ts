import { NextResponse } from "next/server";
import { z } from "zod";
import { apiRoute } from "@/server/http";
import { requireSessionUser } from "@/server/session";
import { listRoomBookings } from "@/server/services/bookings.service";
import type { BookingSlot } from "@/shared/types";

const rangeSchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
});

type RouteContext = { params: Promise<{ id: string }> };

export const GET = apiRoute(async (request: Request, context: RouteContext) => {
  const user = await requireSessionUser();
  const { id: roomId } = await context.params;

  const url = new URL(request.url);
  const { from, to } = rangeSchema.parse({
    from: url.searchParams.get("from"),
    to: url.searchParams.get("to"),
  });

  const bookings = await listRoomBookings(roomId, from, to);
  const slots: BookingSlot[] = bookings.map((booking) => ({
    id: booking.id,
    roomId: booking.roomId,
    title: booking.title,
    startAt: booking.startAt.toISOString(),
    endAt: booking.endAt.toISOString(),
    authorName: booking.user.name,
    isMine: booking.user.id === user.id,
  }));

  return NextResponse.json({ bookings: slots });
});
