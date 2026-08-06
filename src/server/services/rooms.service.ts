import "server-only";
import { prisma } from "@/server/db";

export async function listRoomsWithAvailability(minCapacity?: number) {
  const rooms = await prisma.room.findMany({
    where: minCapacity ? { capacity: { gte: minCapacity } } : undefined,
    orderBy: { name: "asc" },
  });

  const now = new Date();
  const occupiedNow = await prisma.booking.findMany({
    where: {
      roomId: { in: rooms.map((room) => room.id) },
      startAt: { lte: now },
      endAt: { gt: now },
    },
    select: { roomId: true },
  });
  const occupiedRoomIds = new Set(occupiedNow.map((booking) => booking.roomId));

  return rooms.map((room) => ({ ...room, isFreeNow: !occupiedRoomIds.has(room.id) }));
}

export function getRoomById(id: string) {
  return prisma.room.findUnique({ where: { id } });
}
