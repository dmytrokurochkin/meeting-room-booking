import { DateTime } from "luxon";
import type { Interval } from "@/domain/overlap";

export const OFFICE_TIME_ZONE = process.env.OFFICE_TIME_ZONE ?? "Europe/Kyiv";
export const WORK_START_HOUR = 9;
export const WORK_END_HOUR = 19;
export const SLOT_MINUTES = 30;
export const NOTIFY_BEFORE_MINUTES = Number(process.env.NOTIFY_BEFORE_MINUTES) || 10;

export function isSlotAligned(date: Date, zone: string = OFFICE_TIME_ZONE): boolean {
  const local = DateTime.fromJSDate(date, { zone });
  return local.second === 0 && local.millisecond === 0 && local.minute % SLOT_MINUTES === 0;
}

/**
 * Business hours are enforced in office local time, not the viewer's time zone,
 * so a booking must start and end on the same office day within 09:00-19:00.
 */
export function isWithinWorkHours(interval: Interval, zone: string = OFFICE_TIME_ZONE): boolean {
  const start = DateTime.fromJSDate(interval.start, { zone });
  const end = DateTime.fromJSDate(interval.end, { zone });

  if (!start.hasSame(end, "day")) return false;

  const dayStart = start.set({ hour: WORK_START_HOUR, minute: 0, second: 0, millisecond: 0 });
  const dayEnd = start.set({ hour: WORK_END_HOUR, minute: 0, second: 0, millisecond: 0 });

  return start >= dayStart && end <= dayEnd && start < end;
}

export function isInFuture(date: Date, now: Date = new Date()): boolean {
  return date.getTime() > now.getTime();
}
