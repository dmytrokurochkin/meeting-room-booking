import "server-only";
import { prisma } from "@/server/db";
import { NOTIFY_BEFORE_MINUTES, SLOT_MINUTES } from "@/domain/time";

const NOTIFICATION_TYPE_ENDING_SOON = "ENDING_SOON";

function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

async function isNextSlotOccupied(
  roomId: string,
  afterEndAt: Date,
  excludeBookingId: string,
): Promise<boolean> {
  const nextSlotEnd = new Date(afterEndAt.getTime() + SLOT_MINUTES * 60_000);
  const overlapping = await prisma.booking.findFirst({
    where: {
      roomId,
      id: { not: excludeBookingId },
      startAt: { lt: nextSlotEnd },
      endAt: { gt: afterEndAt },
    },
    select: { id: true },
  });
  return overlapping !== null;
}

/**
 * Creates one "ending soon" notification per booking that's about to end with
 * its room's next slot already taken. The (bookingId, type) unique constraint
 * makes this safe to call repeatedly (e.g. from concurrent polls): a second
 * attempt just hits a duplicate-key error, which is swallowed below.
 */
export async function generateDueNotifications(userId: string): Promise<void> {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + NOTIFY_BEFORE_MINUTES * 60_000);

  const candidates = await prisma.booking.findMany({
    where: { userId, endAt: { gt: now, lte: windowEnd } },
    select: { id: true, roomId: true, title: true, endAt: true },
  });

  for (const booking of candidates) {
    const occupied = await isNextSlotOccupied(booking.roomId, booking.endAt, booking.id);
    if (!occupied) continue;

    try {
      await prisma.notification.create({
        data: {
          userId,
          bookingId: booking.id,
          type: NOTIFICATION_TYPE_ENDING_SOON,
          message: `Бронювання «${booking.title}» закінчується через ${NOTIFY_BEFORE_MINUTES} хв — наступний слот уже заброньовано.`,
        },
      });
    } catch (error) {
      if (!isUniqueConstraintViolation(error)) throw error;
    }
  }
}

/**
 * Delivers (marks as seen) any notification still waiting to be shown, after
 * re-checking its condition still holds. If either booking involved got
 * cancelled since the notification was created, it's discarded instead.
 */
export async function deliverPendingNotifications(
  userId: string,
): Promise<{ id: string; message: string }[]> {
  const pending = await prisma.notification.findMany({
    where: { userId, deliveredAt: null },
    include: { booking: { select: { id: true, roomId: true, endAt: true } } },
  });

  const delivered: { id: string; message: string }[] = [];
  for (const notification of pending) {
    const stillOccupied = await isNextSlotOccupied(
      notification.booking.roomId,
      notification.booking.endAt,
      notification.booking.id,
    );
    if (!stillOccupied) {
      await prisma.notification.delete({ where: { id: notification.id } });
      continue;
    }

    await prisma.notification.update({
      where: { id: notification.id },
      data: { deliveredAt: new Date() },
    });
    delivered.push({ id: notification.id, message: notification.message });
  }
  return delivered;
}
