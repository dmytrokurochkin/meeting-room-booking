import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";
import { isSlotAligned, isWithinWorkHours, OFFICE_TIME_ZONE } from "@/domain/time";

function kyiv(iso: string): Date {
  return DateTime.fromISO(iso, { zone: OFFICE_TIME_ZONE }).toJSDate();
}

describe("isSlotAligned", () => {
  it.each([
    ["on the hour", "2026-08-10T10:00:00", true],
    ["on the half hour", "2026-08-10T10:30:00", true],
    ["quarter past", "2026-08-10T10:15:00", false],
    ["with stray seconds", "2026-08-10T10:30:05", false],
  ])("%s", (_desc, iso, expected) => {
    expect(isSlotAligned(kyiv(iso))).toBe(expected);
  });
});

describe("isWithinWorkHours", () => {
  it.each([
    ["right at opening", "2026-08-10T09:00:00", "2026-08-10T10:00:00", true],
    ["right up to closing", "2026-08-10T18:30:00", "2026-08-10T19:00:00", true],
    ["starts before opening", "2026-08-10T08:30:00", "2026-08-10T09:30:00", false],
    ["ends after closing", "2026-08-10T18:30:00", "2026-08-10T19:30:00", false],
    ["crosses midnight into the next day", "2026-08-10T23:00:00", "2026-08-11T01:00:00", false],
    ["zero-length interval", "2026-08-10T10:00:00", "2026-08-10T10:00:00", false],
  ])("%s", (_desc, startIso, endIso, expected) => {
    expect(isWithinWorkHours({ start: kyiv(startIso), end: kyiv(endIso) })).toBe(expected);
  });
});
