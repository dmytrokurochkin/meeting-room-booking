import { DateTime } from "luxon";
import { SLOT_MINUTES, WORK_END_HOUR, WORK_START_HOUR } from "@/domain/time";

export const SLOTS_PER_DAY = ((WORK_END_HOUR - WORK_START_HOUR) * 60) / SLOT_MINUTES;
export const DAYS_PER_WEEK = 7;

/** Monday 00:00 of the office week that contains `reference`. */
export function startOfOfficeWeek(reference: DateTime): DateTime {
  return reference.startOf("day").minus({ days: reference.weekday - 1 });
}

/** Office-local start instant of a given day/slot within a week that began at `weekStart`. */
export function officeSlotStart(
  weekStart: DateTime,
  dayIndex: number,
  slotIndex: number,
): DateTime {
  return weekStart
    .plus({ days: dayIndex })
    .set({ hour: WORK_START_HOUR, minute: 0, second: 0, millisecond: 0 })
    .plus({ minutes: slotIndex * SLOT_MINUTES });
}
