import { describe, expect, it } from "vitest";
import { overlaps } from "@/domain/overlap";

function interval(start: string, end: string) {
  return { start: new Date(start), end: new Date(end) };
}

describe("overlaps", () => {
  it.each([
    [
      "touching: end of one meets start of the other",
      interval("2026-08-10T10:00:00Z", "2026-08-10T11:00:00Z"),
      interval("2026-08-10T11:00:00Z", "2026-08-10T12:00:00Z"),
      false,
    ],
    [
      "touching: reversed order",
      interval("2026-08-10T11:00:00Z", "2026-08-10T12:00:00Z"),
      interval("2026-08-10T10:00:00Z", "2026-08-10T11:00:00Z"),
      false,
    ],
    [
      "partial overlap",
      interval("2026-08-10T10:00:00Z", "2026-08-10T11:00:00Z"),
      interval("2026-08-10T10:30:00Z", "2026-08-10T11:30:00Z"),
      true,
    ],
    [
      "exact match",
      interval("2026-08-10T10:00:00Z", "2026-08-10T11:00:00Z"),
      interval("2026-08-10T10:00:00Z", "2026-08-10T11:00:00Z"),
      true,
    ],
    [
      "one interval nested inside the other",
      interval("2026-08-10T10:00:00Z", "2026-08-10T12:00:00Z"),
      interval("2026-08-10T10:30:00Z", "2026-08-10T11:00:00Z"),
      true,
    ],
    [
      "adjacent days, no overlap",
      interval("2026-08-10T18:00:00Z", "2026-08-10T19:00:00Z"),
      interval("2026-08-11T09:00:00Z", "2026-08-11T10:00:00Z"),
      false,
    ],
    [
      "same day, disjoint slots",
      interval("2026-08-10T18:00:00Z", "2026-08-10T18:30:00Z"),
      interval("2026-08-10T09:00:00Z", "2026-08-10T09:30:00Z"),
      false,
    ],
  ])("%s", (_description, a, b, expected) => {
    expect(overlaps(a, b)).toBe(expected);
    expect(overlaps(b, a)).toBe(expected);
  });
});
