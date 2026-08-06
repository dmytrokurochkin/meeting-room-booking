import "server-only";
import { randomUUID } from "node:crypto";
import { DateTime } from "luxon";
import { prisma } from "@/server/db";
import { ApiError } from "@/server/http";
import { validateBookingRequest, type BookingRuleViolation } from "@/domain/booking-rules";
import { OFFICE_TIME_ZONE } from "@/domain/time";

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

async function assertEmailVerified(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerifiedAt: true },
  });
  if (!user?.emailVerifiedAt) {
    throw new ApiError("EMAIL_NOT_VERIFIED", "Підтвердіть email, щоб бронювати кімнати.");
  }
}

function assertNoRuleViolations(title: string, start: Date, end: Date): void {
  const violations = validateBookingRequest({ title, start, end });
  const blockingViolation = VIOLATION_PRIORITY.find((code) => violations.includes(code));
  if (blockingViolation) {
    throw new ApiError(blockingViolation, VIOLATION_MESSAGES[blockingViolation]!);
  }
}

async function assertSlotAvailable(roomId: string, start: Date, end: Date): Promise<void> {
  const conflict = await prisma.booking.findFirst({
    where: { roomId, startAt: { lt: end }, endAt: { gt: start } },
    select: { id: true },
  });
  if (conflict) throw new ApiError("SLOT_TAKEN", SLOT_TAKEN_MESSAGE);
}

function isExclusionConstraintViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23P01"
  );
}

export async function createBooking(userId: string, input: CreateBookingInput) {
  await assertEmailVerified(userId);
  assertNoRuleViolations(input.title, input.startAt, input.endAt);
  await assertSlotAvailable(input.roomId, input.startAt, input.endAt);

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

export const RECURRING_WEEKS = 8;

export async function createRecurringBooking(userId: string, input: CreateBookingInput) {
  await assertEmailVerified(userId);

  // Weekly recurrence means "same office-local wall-clock time each week", so we
  // add weeks in the office zone instead of a fixed millisecond offset. That keeps
  // it true across a DST transition, where the UTC offset shifts.
  const occurrences = Array.from({ length: RECURRING_WEEKS }, (_, index) => ({
    startAt: DateTime.fromJSDate(input.startAt, { zone: OFFICE_TIME_ZONE })
      .plus({ weeks: index })
      .toJSDate(),
    endAt: DateTime.fromJSDate(input.endAt, { zone: OFFICE_TIME_ZONE })
      .plus({ weeks: index })
      .toJSDate(),
  }));

  for (const occurrence of occurrences) {
    assertNoRuleViolations(input.title, occurrence.startAt, occurrence.endAt);
  }
  for (const occurrence of occurrences) {
    await assertSlotAvailable(input.roomId, occurrence.startAt, occurrence.endAt);
  }

  const seriesId = randomUUID();
  try {
    return await prisma.$transaction(
      occurrences.map((occurrence) =>
        prisma.booking.create({
          data: {
            roomId: input.roomId,
            userId,
            title: input.title,
            startAt: occurrence.startAt,
            endAt: occurrence.endAt,
            seriesId,
          },
          include: { user: { select: { id: true, name: true } } },
        }),
      ),
    );
  } catch (error) {
    if (isExclusionConstraintViolation(error)) {
      throw new ApiError(
        "SLOT_TAKEN",
        `${SLOT_TAKEN_MESSAGE} Хтось встиг зайняти один зі слотів серії.`,
      );
    }
    throw error;
  }
}

export type CancelScope = "single" | "series";

export async function cancelBooking(
  userId: string,
  bookingId: string,
  scope: CancelScope = "single",
): Promise<void> {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new ApiError("NOT_FOUND", "Бронювання не знайдено.");
  if (booking.userId !== userId) throw new ApiError("FORBIDDEN", "Це не ваше бронювання.");

  if (scope === "series" && booking.seriesId) {
    await prisma.booking.deleteMany({
      where: { seriesId: booking.seriesId, userId, startAt: { gte: new Date() } },
    });
    return;
  }

  await prisma.booking.delete({ where: { id: bookingId } });
}

export type BookingScope = "upcoming" | "past";

export function listMyBookings(
  userId: string,
  scope: BookingScope,
  page: { skip: number; take: number },
) {
  const now = new Date();
  return prisma.booking.findMany({
    where: {
      userId,
      startAt: scope === "upcoming" ? { gte: now } : { lt: now },
    },
    include: { room: { select: { id: true, name: true } } },
    orderBy: { startAt: scope === "upcoming" ? "asc" : "desc" },
    skip: page.skip,
    take: page.take,
  });
}
