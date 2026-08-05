"use client";

import { DateTime } from "luxon";
import { useEffect, useMemo, useState } from "react";
import { officeSlotStart, SLOTS_PER_DAY, startOfOfficeWeek } from "@/domain/schedule";
import { SLOT_MINUTES, WORK_START_HOUR } from "@/domain/time";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { BookingDialog } from "@/components/booking/BookingDialog";
import { useApi } from "@/lib/use-api";
import { useUserTimeZone } from "@/hooks/useUserTimeZone";
import type { BookingSlot, Room } from "@/shared/types";

const SLOT_ROW_HEIGHT = 40;

type RoomScheduleProps = {
  room: Room;
  officeTimeZone: string;
};

export function RoomSchedule({ room, officeTimeZone }: RoomScheduleProps) {
  const userTimeZone = useUserTimeZone();
  const [weekOffset, setWeekOffset] = useState(0);
  const [now, setNow] = useState(() => DateTime.now().setZone(officeTimeZone));
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(DateTime.now().setZone(officeTimeZone)), 60_000);
    return () => clearInterval(timer);
  }, [officeTimeZone]);

  const currentWeekStart = useMemo(
    () => startOfOfficeWeek(DateTime.now().setZone(officeTimeZone)),
    [officeTimeZone],
  );
  const weekStart = useMemo(
    () => currentWeekStart.plus({ weeks: weekOffset }),
    [currentWeekStart, weekOffset],
  );

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => weekStart.plus({ days: i })),
    [weekStart],
  );
  const slotIndexes = useMemo(() => Array.from({ length: SLOTS_PER_DAY }, (_, i) => i), []);

  const rangeFrom = weekStart.toUTC().toISO();
  const rangeTo = weekStart.plus({ days: 7 }).toUTC().toISO();
  const { data, error, isLoading, mutate } = useApi<{ bookings: BookingSlot[] }>(
    `/api/rooms/${room.id}/bookings?from=${encodeURIComponent(rangeFrom ?? "")}&to=${encodeURIComponent(rangeTo ?? "")}`,
  );

  const bookingsByDay = useMemo(() => {
    const map = new Map<string, BookingSlot[]>();
    for (const booking of data?.bookings ?? []) {
      const localDate = DateTime.fromISO(booking.startAt, { zone: officeTimeZone }).toISODate();
      if (!localDate) continue;
      const list = map.get(localDate) ?? [];
      list.push(booking);
      map.set(localDate, list);
    }
    return map;
  }, [data, officeTimeZone]);

  const nowRow = (now.hour * 60 + now.minute - WORK_START_HOUR * 60) / SLOT_MINUTES;
  const nowInWeek = now >= weekStart && now < weekStart.plus({ days: 7 });
  const showNowLine = nowInWeek && nowRow >= 0 && nowRow <= SLOTS_PER_DAY;
  const nowSlotFloor = Math.floor(nowRow);
  const nowSlotFraction = nowRow - nowSlotFloor;

  const weekEnd = weekStart.plus({ days: 6 });
  const weekLabel =
    weekStart.month === weekEnd.month
      ? `${weekStart.toFormat("d")}–${weekEnd.toFormat("d MMMM yyyy", { locale: "uk" })}`
      : `${weekStart.toFormat("d MMM", { locale: "uk" })} – ${weekEnd.toFormat("d MMM yyyy", { locale: "uk" })}`;

  const isForeignTimeZone = userTimeZone !== officeTimeZone;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setWeekOffset((value) => value - 1)}>
            ← Попередній тиждень
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setWeekOffset((value) => value + 1)}>
            Наступний тиждень →
          </Button>
          {weekOffset !== 0 && (
            <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)}>
              Сьогодні
            </Button>
          )}
        </div>
        <p className="text-sm font-medium text-foreground capitalize">{weekLabel}</p>
      </div>

      {isForeignTimeZone && (
        <p className="text-xs text-muted">
          Час показано у вашому поясі ({userTimeZone}). Офіс працює 09:00–19:00 за {officeTimeZone}.
        </p>
      )}

      {error && <ErrorBanner message={error.message} onRetry={() => mutate()} />}
      {isLoading && <p className="text-sm text-muted">Завантаження розкладу…</p>}
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
              className={`sticky top-0 z-10 border-b border-border px-2 py-2 text-center text-sm font-medium ${
                day.hasSame(now, "day") ? "bg-accent/10 text-accent" : "bg-surface text-foreground"
              }`}
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
              {slotIndex % 2 === 0
                ? officeSlotStart(weekStart, 0, slotIndex).setZone(userTimeZone).toFormat("HH:mm")
                : ""}
            </div>
          ))}

          {days.map((day, dayIndex) =>
            slotIndexes.map((slotIndex) => {
              const slot = officeSlotStart(weekStart, dayIndex, slotIndex);
              const isPast = slot <= now;

              return (
                <button
                  key={`cell-${dayIndex}-${slotIndex}`}
                  type="button"
                  disabled={isPast}
                  onClick={() => setSelectedSlot(slot.toJSDate())}
                  aria-label={`Забронювати ${slot.toFormat("EEEE HH:mm", { locale: "uk" })}`}
                  className={`focus-ring m-0 h-full w-full appearance-none border-0 border-b border-border bg-transparent p-0 text-left ${
                    day.hasSame(now, "day") ? "bg-accent/5" : ""
                  } ${isPast ? "cursor-default" : "cursor-pointer hover:bg-accent/10"}`}
                  style={{ gridColumn: dayIndex + 2, gridRow: slotIndex + 2 }}
                />
              );
            }),
          )}

          {days.map((day, dayIndex) =>
            (bookingsByDay.get(day.toISODate() ?? "") ?? []).map((booking) => {
              const localStart = DateTime.fromISO(booking.startAt, { zone: officeTimeZone });
              const localEnd = DateTime.fromISO(booking.endAt, { zone: officeTimeZone });
              const startRow = Math.round(
                (localStart.hour * 60 + localStart.minute - WORK_START_HOUR * 60) / SLOT_MINUTES,
              );
              const span = Math.max(
                1,
                Math.round(localEnd.diff(localStart, "minutes").minutes / SLOT_MINUTES),
              );

              return (
                <div
                  key={booking.id}
                  style={{ gridColumn: dayIndex + 2, gridRow: `${startRow + 2} / span ${span}` }}
                  className={`m-0.5 overflow-hidden rounded-md px-2 py-1 text-left text-xs ${
                    booking.isMine
                      ? "bg-accent text-accent-foreground"
                      : "border border-border bg-background text-foreground"
                  }`}
                >
                  <p className="truncate font-medium">{booking.title}</p>
                  <p className="truncate opacity-80">
                    {booking.isMine ? "Ви" : booking.authorName}
                  </p>
                </div>
              );
            }),
          )}

          {showNowLine && (
            <div
              className="pointer-events-none relative"
              style={{ gridColumn: "2 / -1", gridRow: nowSlotFloor + 2 }}
            >
              <div
                className="absolute inset-x-0 flex items-center"
                style={{ top: `${nowSlotFraction * 100}%` }}
              >
                <span className="-ml-1 h-2 w-2 rounded-full bg-danger" />
                <span className="h-px flex-1 bg-danger" />
              </div>
            </div>
          )}
        </div>
      </div>

      <BookingDialog
        key={selectedSlot?.toISOString() ?? "closed"}
        open={selectedSlot !== null}
        onClose={() => setSelectedSlot(null)}
        roomId={room.id}
        slotStart={selectedSlot}
        officeTimeZone={officeTimeZone}
        onCreated={() => mutate()}
      />
    </div>
  );
}
