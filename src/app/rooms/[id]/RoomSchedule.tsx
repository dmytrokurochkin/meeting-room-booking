"use client";

import { DateTime } from "luxon";
import { useMemo } from "react";
import { officeSlotStart, SLOTS_PER_DAY, startOfOfficeWeek } from "@/domain/schedule";
import type { Room } from "@/shared/types";

const SLOT_ROW_HEIGHT = 40;

type RoomScheduleProps = {
  room: Room;
  officeTimeZone: string;
};

export function RoomSchedule({ officeTimeZone }: RoomScheduleProps) {
  const weekStart = useMemo(
    () => startOfOfficeWeek(DateTime.now().setZone(officeTimeZone)),
    [officeTimeZone],
  );

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => weekStart.plus({ days: i })),
    [weekStart],
  );
  const slotIndexes = useMemo(() => Array.from({ length: SLOTS_PER_DAY }, (_, i) => i), []);

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <div
        className="grid min-w-[720px]"
        style={{
          gridTemplateColumns: `64px repeat(7, minmax(96px, 1fr))`,
          gridTemplateRows: `40px repeat(${SLOTS_PER_DAY}, ${SLOT_ROW_HEIGHT}px)`,
        }}
      >
        <div
          className="sticky top-0 left-0 z-20 border-r border-b border-border bg-surface"
          style={{ gridColumn: 1, gridRow: 1 }}
        />

        {days.map((day, dayIndex) => (
          <div
            key={day.toISODate()}
            className="sticky top-0 z-10 border-b border-border bg-surface px-2 py-2 text-center text-sm font-medium text-foreground"
            style={{ gridColumn: dayIndex + 2, gridRow: 1 }}
          >
            {day.setLocale("uk").toFormat("EEE, d MMM")}
          </div>
        ))}

        {slotIndexes.map((slotIndex) => (
          <div
            key={`time-${slotIndex}`}
            className="sticky left-0 z-10 border-r border-b border-border bg-surface px-2 text-right text-xs text-muted"
            style={{ gridColumn: 1, gridRow: slotIndex + 2 }}
          >
            {slotIndex % 2 === 0 ? officeSlotStart(weekStart, 0, slotIndex).toFormat("HH:mm") : ""}
          </div>
        ))}

        {days.map((_, dayIndex) =>
          slotIndexes.map((slotIndex) => (
            <div
              key={`cell-${dayIndex}-${slotIndex}`}
              className="border-b border-border"
              style={{ gridColumn: dayIndex + 2, gridRow: slotIndex + 2 }}
            />
          )),
        )}
      </div>
    </div>
  );
}
