"use client";

import { DateTime } from "luxon";
import { useEffect, useMemo, useState } from "react";
import { officeSlotStart, SLOTS_PER_DAY, startOfOfficeWeek } from "@/domain/schedule";
import { SLOT_MINUTES, WORK_START_HOUR } from "@/domain/time";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { BookingDialog } from "@/components/booking/BookingDialog";
import { CancelBookingDialog } from "@/components/booking/CancelBookingDialog";
import { useApi } from "@/lib/use-api";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useUserTimeZone } from "@/hooks/useUserTimeZone";
import type { BookingSlot, Room } from "@/shared/types";

type MobileView = "day" | "week";

const SLOT_ROW_HEIGHT = 40;

type RoomScheduleProps = {
  room: Room;
  officeTimeZone: string;
  initialDate?: string;
};

export function RoomSchedule({ room, officeTimeZone, initialDate }: RoomScheduleProps) {
  const userTimeZone = useUserTimeZone();
  const isMobile = useIsMobile();
  const [mobileView, setMobileView] = useState<MobileView>("day");
  const [selectedDayIndex, setSelectedDayIndex] = useState(
    () => DateTime.now().setZone(officeTimeZone).weekday - 1,
  );
  const currentWeekStart = useMemo(
    () => startOfOfficeWeek(DateTime.now().setZone(officeTimeZone)),
    [officeTimeZone],
  );

  const [weekOffset, setWeekOffset] = useState(() => {
    if (!initialDate) return 0;
    const targetWeekStart = startOfOfficeWeek(
      DateTime.fromISO(initialDate, { zone: officeTimeZone }),
    );
    return Math.round(targetWeekStart.diff(currentWeekStart, "weeks").weeks);
  });
  const [now, setNow] = useState(() => DateTime.now().setZone(officeTimeZone));
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [cancelTarget, setCancelTarget] = useState<BookingSlot | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(DateTime.now().setZone(officeTimeZone)), 60_000);
    return () => clearInterval(timer);
  }, [officeTimeZone]);

  const weekStart = useMemo(
    () => currentWeekStart.plus({ weeks: weekOffset }),
    [currentWeekStart, weekOffset],
  );

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => weekStart.plus({ days: i })),
    [weekStart],
  );
  const slotIndexes = useMemo(() => Array.from({ length: SLOTS_PER_DAY }, (_, i) => i), []);

  const dayModeActive = isMobile && mobileView === "day";
  const visibleDayIndexes = useMemo(
    () => (dayModeActive ? [selectedDayIndex] : [0, 1, 2, 3, 4, 5, 6]),
    [dayModeActive, selectedDayIndex],
  );
  const colOf = (dayIndex: number) => visibleDayIndexes.indexOf(dayIndex) + 2;

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
  const nowDayVisible = !dayModeActive || days[selectedDayIndex]?.hasSame(now, "day");
  const showNowLine = nowInWeek && nowDayVisible && nowRow >= 0 && nowRow <= SLOTS_PER_DAY;
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

      {isMobile && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1 rounded-lg border border-border bg-surface p-1">
            <button
              type="button"
              onClick={() => setMobileView("day")}
              className={`focus-ring rounded-md px-3 py-1 text-sm font-medium ${
                mobileView === "day"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted hover:text-foreground"
              }`}
            >
              День
            </button>
            <button
              type="button"
              onClick={() => setMobileView("week")}
              className={`focus-ring rounded-md px-3 py-1 text-sm font-medium ${
                mobileView === "week"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Тиждень
            </button>
          </div>
          {dayModeActive && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSelectedDayIndex((value) => Math.max(0, value - 1))}
                disabled={selectedDayIndex === 0}
                aria-label="Попередній день"
                className="focus-ring rounded-md border border-border px-2 py-1 text-sm disabled:opacity-40"
              >
                ‹
              </button>
              <span className="w-24 text-center text-sm font-medium text-foreground capitalize">
                {days[selectedDayIndex]?.setLocale("uk").toFormat("EEE, d MMM")}
              </span>
              <button
                type="button"
                onClick={() => setSelectedDayIndex((value) => Math.min(6, value + 1))}
                disabled={selectedDayIndex === 6}
                aria-label="Наступний день"
                className="focus-ring rounded-md border border-border px-2 py-1 text-sm disabled:opacity-40"
              >
                ›
              </button>
            </div>
          )}
        </div>
      )}

      {error && <ErrorBanner message={error.message} onRetry={() => mutate()} />}
      {isLoading && <p className="text-sm text-muted">Завантаження розкладу…</p>}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <div
          className={`grid ${dayModeActive ? "" : "min-w-[720px]"}`}
          style={{
            gridTemplateColumns: `64px repeat(${visibleDayIndexes.length}, minmax(96px, 1fr))`,
            gridTemplateRows: `40px repeat(${SLOTS_PER_DAY}, ${SLOT_ROW_HEIGHT}px)`,
          }}
        >
          <div
            className="sticky top-0 left-0 z-20 border-r border-b border-border bg-surface"
            style={{ gridColumn: 1, gridRow: 1 }}
          />

          {visibleDayIndexes.map((dayIndex) => {
            const day = days[dayIndex];
            return (
              <div
                key={day.toISODate()}
                className={`sticky top-0 z-10 border-b border-border px-2 py-2 text-center text-sm font-medium ${
                  day.hasSame(now, "day") ? "bg-accent/10 text-accent" : "bg-surface text-foreground"
                }`}
                style={{ gridColumn: colOf(dayIndex), gridRow: 1 }}
              >
                {day.setLocale("uk").toFormat("EEE, d MMM")}
              </div>
            );
          })}

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

          {visibleDayIndexes.map((dayIndex) => {
            const day = days[dayIndex];
            return slotIndexes.map((slotIndex) => {
              const slot = officeSlotStart(weekStart, dayIndex, slotIndex);
              const isPast = slot <= now;

              return (
                <button
                  key={`cell-${dayIndex}-${slotIndex}`}
                  type="button"
                  disabled={isPast}
                  onClick={() => setSelectedSlot(slot.toJSDate())}
                  aria-label={`Забронювати ${slot.setZone(userTimeZone).toFormat("EEEE HH:mm", { locale: "uk" })}`}
                  className={`focus-ring m-0 h-full w-full appearance-none border-0 border-b border-border bg-transparent p-0 text-left ${
                    day.hasSame(now, "day") ? "bg-accent/5" : ""
                  } ${isPast ? "cursor-default" : "cursor-pointer hover:bg-accent/10"}`}
                  style={{ gridColumn: colOf(dayIndex), gridRow: slotIndex + 2 }}
                />
              );
            });
          })}

          {visibleDayIndexes.map((dayIndex) => {
            const day = days[dayIndex];
            return (bookingsByDay.get(day.toISODate() ?? "") ?? []).map((booking) => {
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
                <button
                  key={booking.id}
                  type="button"
                  disabled={!booking.isMine}
                  onClick={() => setCancelTarget(booking)}
                  style={{ gridColumn: colOf(dayIndex), gridRow: `${startRow + 2} / span ${span}` }}
                  className={`focus-ring m-0.5 overflow-hidden rounded-md border px-2 py-1 text-left text-xs ${
                    booking.isMine
                      ? "cursor-pointer border-transparent bg-accent text-accent-foreground hover:opacity-90"
                      : "cursor-default border-border bg-background text-foreground"
                  }`}
                >
                  <p className="truncate font-medium">{booking.title}</p>
                  <p className="truncate opacity-80">
                    {booking.isMine ? "Ви" : booking.authorName}
                  </p>
                </button>
              );
            });
          })}

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

      <CancelBookingDialog
        booking={cancelTarget}
        timeZone={userTimeZone}
        onClose={() => setCancelTarget(null)}
        onCancelled={() => mutate()}
      />
    </div>
  );
}
