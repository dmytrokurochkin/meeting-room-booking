import { isInFuture, isSlotAligned, isWithinWorkHours } from "@/domain/time";
import type { Interval } from "@/domain/overlap";

export const TITLE_MIN_LENGTH = 1;
export const TITLE_MAX_LENGTH = 100;
export const MIN_DURATION_MINUTES = 30;
export const MAX_DURATION_MINUTES = 4 * 60;

export type BookingRequest = Interval & {
  title: string;
};

export type BookingRuleViolation =
  | "TITLE_REQUIRED"
  | "TITLE_TOO_LONG"
  | "NOT_SLOT_ALIGNED"
  | "TOO_SHORT"
  | "TOO_LONG"
  | "OUTSIDE_WORK_HOURS"
  | "IN_THE_PAST";

/**
 * Pure validation of a booking request against the rules in the spec, independent
 * of any overlap check against existing bookings (that needs a database read).
 */
export function validateBookingRequest(
  request: BookingRequest,
  now: Date = new Date(),
): BookingRuleViolation[] {
  const violations: BookingRuleViolation[] = [];
  const title = request.title.trim();

  if (title.length < TITLE_MIN_LENGTH) violations.push("TITLE_REQUIRED");
  if (title.length > TITLE_MAX_LENGTH) violations.push("TITLE_TOO_LONG");

  if (!isSlotAligned(request.start) || !isSlotAligned(request.end)) {
    violations.push("NOT_SLOT_ALIGNED");
  }

  const durationMinutes = (request.end.getTime() - request.start.getTime()) / (60 * 1000);
  if (durationMinutes < MIN_DURATION_MINUTES) violations.push("TOO_SHORT");
  if (durationMinutes > MAX_DURATION_MINUTES) violations.push("TOO_LONG");

  if (!isWithinWorkHours(request)) violations.push("OUTSIDE_WORK_HOURS");
  if (!isInFuture(request.start, now)) violations.push("IN_THE_PAST");

  return violations;
}
