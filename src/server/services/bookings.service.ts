import "server-only";
import { prisma } from "@/server/db";
import { ApiError } from "@/server/http";
import { validateBookingRequest, type BookingRuleViolation } from "@/domain/booking-rules";

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

type CreateBookingInput = {
  roomId: string;
  title: string;
  startAt: Date;
  endAt: Date;
};

const VIOLATION_PRIORITY = [
  "IN_THE_PAST",
  "OUTSIDE_WORK_HOURS",
  "NOT_SLOT_ALIGNED",
  "TOO_SHORT",
  "TOO_LONG",
] as const satisfies readonly BookingRuleViolation[];

const VIOLATION_MESSAGES: Partial<Record<BookingRuleViolation, string>> = {
  IN_THE_PAST: "Час бронювання вже минув.",
  OUTSIDE_WORK_HOURS: "Час поза робочими годинами кімнати (09:00–19:00).",
  NOT_SLOT_ALIGNED: "Час має бути кратний 30 хвилинам.",
  TOO_SHORT: "Мінімальна тривалість бронювання — 30 хвилин.",
  TOO_LONG: "Максимальна тривалість бронювання не може перевищувати 4 години.",
};

const SLOT_TAKEN_MESSAGE = "Цей час уже заброньовано. Оберіть інший слот.";

export async function createBooking(userId: string, input: CreateBookingInput) {
  const violations = validateBookingRequest({
    title: input.title,
    start: input.startAt,
    end: input.endAt,
  });
  const blockingViolation = VIOLATION_PRIORITY.find((code) => violations.includes(code));
  if (blockingViolation) {
    throw new ApiError(blockingViolation, VIOLATION_MESSAGES[blockingViolation]!);
  }

  const conflict = await prisma.booking.findFirst({
    where: { roomId: input.roomId, startAt: { lt: input.endAt }, endAt: { gt: input.startAt } },
    select: { id: true },
  });
  if (conflict) throw new ApiError("SLOT_TAKEN", SLOT_TAKEN_MESSAGE);

  try {
    return await prisma.booking.create({
      data: {
        roomId: input.roomId,
        userId,
        title: input.title,
        startAt: input.startAt,
        endAt: input.endAt,
      },
      include: { user: { select: { id: true, name: true } } },
    });
  } catch (error) {
    if (isExclusionConstraintViolation(error)) {
      throw new ApiError("SLOT_TAKEN", SLOT_TAKEN_MESSAGE);
    }
    throw error;
  }
}

function isExclusionConstraintViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23P01"
  );
}
