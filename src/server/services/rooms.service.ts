import "server-only";
import { prisma } from "@/server/db";

export function listRooms(minCapacity?: number) {
  return prisma.room.findMany({
    where: minCapacity ? { capacity: { gte: minCapacity } } : undefined,
    orderBy: { name: "asc" },
  });
}

export function getRoomById(id: string) {
  return prisma.room.findUnique({ where: { id } });
}
