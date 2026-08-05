import { NextResponse } from "next/server";
import { z } from "zod";
import { apiRoute } from "@/server/http";
import { requireSessionUser } from "@/server/session";
import { listMyBookings } from "@/server/services/bookings.service";
import type { MyBookingItem } from "@/shared/types";

const PAGE_SIZE = 10;

const querySchema = z.object({
  scope: z.enum(["upcoming", "past"]),
  page: z.coerce.number().int().min(0).default(0),
});

export const GET = apiRoute(async (request) => {
  const user = await requireSessionUser();
  const url = new URL(request.url);
  const { scope, page } = querySchema.parse({
    scope: url.searchParams.get("scope"),
    page: url.searchParams.get("page") ?? undefined,
  });

  const rows = await listMyBookings(user.id, scope, {
    skip: page * PAGE_SIZE,
    take: PAGE_SIZE + 1,
  });
  const hasMore = rows.length > PAGE_SIZE;
  const bookings: MyBookingItem[] = rows.slice(0, PAGE_SIZE).map((booking) => ({
    id: booking.id,
    roomId: booking.room.id,
    roomName: booking.room.name,
    title: booking.title,
    startAt: booking.startAt.toISOString(),
    endAt: booking.endAt.toISOString(),
  }));

  return NextResponse.json({ bookings, hasMore });
});
