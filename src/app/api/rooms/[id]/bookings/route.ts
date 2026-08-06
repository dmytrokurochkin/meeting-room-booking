import { NextResponse } from "next/server";
import { z } from "zod";
import { apiRoute, parseJsonBody } from "@/server/http";
import { requireSessionUser } from "@/server/session";
import {
  createBooking,
  createRecurringBooking,
  listRoomBookings,
} from "@/server/services/bookings.service";
import { createBookingSchema } from "@/shared/schemas";
import type { BookingSlot } from "@/shared/types";
import type { Booking, User } from "@/generated/prisma/client";

const rangeSchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
});

type RouteContext = { params: Promise<{ id: string }> };

function toBookingSlot(
  booking: Booking & { user: Pick<User, "id" | "name"> },
  viewerId: string,
): BookingSlot {
  return {
    id: booking.id,
    roomId: booking.roomId,
    title: booking.title,
    startAt: booking.startAt.toISOString(),
    endAt: booking.endAt.toISOString(),
    authorName: booking.user.name,
    isMine: booking.user.id === viewerId,
    seriesId: booking.seriesId,
  };
}

export const GET = apiRoute(async (request: Request, context: RouteContext) => {
  const user = await requireSessionUser();
  const { id: roomId } = await context.params;

  const url = new URL(request.url);
  const { from, to } = rangeSchema.parse({
    from: url.searchParams.get("from"),
    to: url.searchParams.get("to"),
  });

  const bookings = await listRoomBookings(roomId, from, to);
  const slots = bookings.map((booking) => toBookingSlot(booking, user.id));

  return NextResponse.json({ bookings: slots });
});

export const POST = apiRoute(async (request: Request, context: RouteContext) => {
  const user = await requireSessionUser();
  const { id: roomId } = await context.params;
  const { recurring, ...input } = await parseJsonBody(request, createBookingSchema);

  if (recurring) {
    const bookings = await createRecurringBooking(user.id, { roomId, ...input });
    const slots = bookings.map((booking) => toBookingSlot(booking, user.id));
    return NextResponse.json({ bookings: slots }, { status: 201 });
  }

  const booking = await createBooking(user.id, { roomId, ...input });
  return NextResponse.json({ booking: toBookingSlot(booking, user.id) }, { status: 201 });
});
