import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";
import { validateBookingRequest } from "@/domain/booking-rules";
import { OFFICE_TIME_ZONE } from "@/domain/time";

function kyiv(iso: string): Date {
  return DateTime.fromISO(iso, { zone: OFFICE_TIME_ZONE }).toJSDate();
}

const NOW = kyiv("2026-08-01T00:00:00");

describe("validateBookingRequest", () => {
  it("accepts a valid future request within work hours", () => {
    const violations = validateBookingRequest(
      {
        title: "Daily sync",
        start: kyiv("2026-08-10T10:00:00"),
        end: kyiv("2026-08-10T10:30:00"),
      },
      NOW,
    );
    expect(violations).toEqual([]);
  });

  it("rejects an empty title", () => {
    const violations = validateBookingRequest(
      { title: "   ", start: kyiv("2026-08-10T10:00:00"), end: kyiv("2026-08-10T10:30:00") },
      NOW,
    );
    expect(violations).toContain("TITLE_REQUIRED");
  });

  it("rejects a title over 100 characters", () => {
    const violations = validateBookingRequest(
      {
        title: "x".repeat(101),
        start: kyiv("2026-08-10T10:00:00"),
        end: kyiv("2026-08-10T10:30:00"),
      },
      NOW,
    );
    expect(violations).toContain("TITLE_TOO_LONG");
  });

  it("rejects a duration under 30 minutes", () => {
    const violations = validateBookingRequest(
      {
        title: "Quick chat",
        start: kyiv("2026-08-10T10:00:00"),
        end: kyiv("2026-08-10T10:15:00"),
      },
      NOW,
    );
    expect(violations).toContain("TOO_SHORT");
  });

  it("rejects a duration over 4 hours", () => {
    const violations = validateBookingRequest(
      {
        title: "Marathon workshop",
        start: kyiv("2026-08-10T09:00:00"),
        end: kyiv("2026-08-10T13:30:00"),
      },
      NOW,
    );
    expect(violations).toContain("TOO_LONG");
  });

  it("accepts a duration of exactly 4 hours", () => {
    const violations = validateBookingRequest(
      {
        title: "Long workshop",
        start: kyiv("2026-08-10T09:00:00"),
        end: kyiv("2026-08-10T13:00:00"),
      },
      NOW,
    );
    expect(violations).toEqual([]);
  });

  it("rejects a start time in the past", () => {
    const violations = validateBookingRequest(
      {
        title: "Yesterday's meeting",
        start: kyiv("2026-07-01T10:00:00"),
        end: kyiv("2026-07-01T10:30:00"),
      },
      NOW,
    );
    expect(violations).toContain("IN_THE_PAST");
  });

  it("rejects a slot outside working hours", () => {
    const violations = validateBookingRequest(
      { title: "Too early", start: kyiv("2026-08-10T07:00:00"), end: kyiv("2026-08-10T07:30:00") },
      NOW,
    );
    expect(violations).toContain("OUTSIDE_WORK_HOURS");
  });

  it("rejects a start time not aligned to 30 minutes", () => {
    const violations = validateBookingRequest(
      { title: "Off grid", start: kyiv("2026-08-10T10:10:00"), end: kyiv("2026-08-10T10:40:00") },
      NOW,
    );
    expect(violations).toContain("NOT_SLOT_ALIGNED");
  });
});
