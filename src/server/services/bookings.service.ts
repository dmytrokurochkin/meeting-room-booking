import "server-only";
import { prisma } from "@/server/db";

export function listRoomBookings(roomId: string, from: Date, to: Date) {
  return prisma.booking.findMany({
    where: {
      roomId,
      startAt: { lt: to },
      endAt: { gt: from },
    },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { startAt: "asc" },
  });
}
