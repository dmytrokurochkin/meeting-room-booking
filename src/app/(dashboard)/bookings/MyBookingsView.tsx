"use client";

import { DateTime } from "luxon";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type KeyboardEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { CancelBookingDialog, type CancelTarget } from "@/components/booking/CancelBookingDialog";
import { CalendarIcon } from "@/components/icons";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import { useUserTimeZone } from "@/hooks/useUserTimeZone";
import { getJson, type ApiErrorPayload } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import type { MyBookingItem } from "@/shared/types";

type Tab = "upcoming" | "past";

function BookingRow({
  booking,
  timeZone,
  onCancel,
}: {
  booking: MyBookingItem;
  timeZone: string;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const start = DateTime.fromISO(booking.startAt, { zone: timeZone });
  const end = DateTime.fromISO(booking.endAt, { zone: timeZone });
  const href = `/rooms/${booking.roomId}?date=${encodeURIComponent(booking.startAt)}`;

  function goToRoom() {
    router.push(href);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter") goToRoom();
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={goToRoom}
      onKeyDown={handleKeyDown}
      className="focus-ring flex cursor-pointer flex-col items-start gap-2 rounded-xl border border-border bg-surface px-4 py-3 shadow-sm transition-all hover:-translate-y-px hover:border-accent hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:gap-4"
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-sm font-medium text-foreground">{booking.title}</p>
        <p className="text-sm text-muted">
          {start.setLocale("uk").toFormat("EEEE, d MMMM · HH:mm")}–{end.toFormat("HH:mm")} ·{" "}
          {booking.roomName}
        </p>
      </div>
      {onCancel && (
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={(event) => {
            event.stopPropagation();
            onCancel();
          }}
        >
          Скасувати
        </Button>
      )}
    </div>
  );
}

export function MyBookingsView() {
  const timeZone = useUserTimeZone();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [cancelTarget, setCancelTarget] = useState<CancelTarget | null>(null);

  const {
    data: upcomingData,
    error: upcomingError,
    isLoading: upcomingLoading,
    mutate: mutateUpcoming,
  } = useApi<{ bookings: MyBookingItem[] }>("/api/bookings/mine?scope=upcoming&page=0");

  const [pastItems, setPastItems] = useState<MyBookingItem[]>([]);
  const [pastLoaded, setPastLoaded] = useState(false);
  const [pastLoading, setPastLoading] = useState(false);
  const [pastError, setPastError] = useState<string | null>(null);
  const [pastPage, setPastPage] = useState(0);
  const [pastHasMore, setPastHasMore] = useState(false);

  async function loadPastPage(page: number) {
    setPastLoading(true);
    setPastError(null);
    try {
      const data = await getJson<{ bookings: MyBookingItem[]; hasMore: boolean }>(
        `/api/bookings/mine?scope=past&page=${page}`,
      );
      setPastItems((current) => (page === 0 ? data.bookings : [...current, ...data.bookings]));
      setPastHasMore(data.hasMore);
      setPastPage(page);
      setPastLoaded(true);
    } catch (err) {
      setPastError((err as ApiErrorPayload).message);
    } finally {
      setPastLoading(false);
    }
  }

  function handleTabClick(nextTab: Tab) {
    setTab(nextTab);
    if (nextTab === "past" && !pastLoaded && !pastLoading) {
      loadPastPage(0);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 rounded-lg border border-border bg-surface p-1 w-fit">
        <button
          type="button"
          onClick={() => handleTabClick("upcoming")}
          className={`focus-ring rounded-md px-4 py-1.5 text-sm font-medium ${
            tab === "upcoming"
              ? "bg-accent text-accent-foreground"
              : "text-muted hover:text-foreground"
          }`}
        >
          Майбутні
        </button>
        <button
          type="button"
          onClick={() => handleTabClick("past")}
          className={`focus-ring rounded-md px-4 py-1.5 text-sm font-medium ${
            tab === "past" ? "bg-accent text-accent-foreground" : "text-muted hover:text-foreground"
          }`}
        >
          Минулі
        </button>
      </div>

      {tab === "upcoming" && (
        <div className="flex flex-col gap-2">
          {upcomingError && (
            <ErrorBanner message={upcomingError.message} onRetry={() => mutateUpcoming()} />
          )}

          {!upcomingError && upcomingLoading && (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-16" />
              ))}
            </div>
          )}

          {!upcomingError && !upcomingLoading && upcomingData?.bookings.length === 0 && (
            <EmptyState
              icon={<CalendarIcon className="h-8 w-8" />}
              title="У вас ще немає бронювань"
              description="Оберіть кімнату і забронюйте вільний час."
              action={
                <Link href="/rooms">
                  <Button size="sm">До кімнат</Button>
                </Link>
              }
            />
          )}

          {!upcomingError &&
            upcomingData?.bookings.map((booking) => (
              <BookingRow
                key={booking.id}
                booking={booking}
                timeZone={timeZone}
                onCancel={() => setCancelTarget(booking)}
              />
            ))}
        </div>
      )}

      {tab === "past" && (
        <div className="flex flex-col gap-2">
          {pastError && <ErrorBanner message={pastError} onRetry={() => loadPastPage(pastPage)} />}

          {!pastError && pastLoading && pastItems.length === 0 && (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-16" />
              ))}
            </div>
          )}

          {!pastError && pastLoaded && pastItems.length === 0 && (
            <EmptyState
              icon={<CalendarIcon className="h-8 w-8" />}
              title="У вас ще немає минулих бронювань"
            />
          )}

          {pastItems.map((booking) => (
            <BookingRow key={booking.id} booking={booking} timeZone={timeZone} />
          ))}

          {pastHasMore && (
            <Button
              variant="secondary"
              size="sm"
              loading={pastLoading && pastItems.length > 0}
              onClick={() => loadPastPage(pastPage + 1)}
              className="self-center"
            >
              Показати ще
            </Button>
          )}
        </div>
      )}

      <CancelBookingDialog
        booking={cancelTarget}
        timeZone={timeZone}
        onClose={() => setCancelTarget(null)}
        onCancelled={() => mutateUpcoming()}
      />
    </div>
  );
}
