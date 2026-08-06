"use client";

import { DateTime } from "luxon";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { WORK_END_HOUR } from "@/domain/time";
import { useUserTimeZone } from "@/hooks/useUserTimeZone";
import { postJson, type ApiErrorPayload } from "@/lib/api";
import type { BookingSlot } from "@/shared/types";

const DURATION_OPTIONS_MINUTES = [30, 60, 90, 120, 150, 180, 210, 240];
const RECURRING_WEEKS = 8;

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} хв`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} год ${rest} хв` : `${hours} год`;
}

type BookingDialogProps = {
  open: boolean;
  onClose: () => void;
  roomId: string;
  slotStart: Date | null;
  officeTimeZone: string;
  onCreated: () => void;
};

export function BookingDialog({
  open,
  onClose,
  roomId,
  slotStart,
  officeTimeZone,
  onCreated,
}: BookingDialogProps) {
  const userTimeZone = useUserTimeZone();
  const { showToast } = useToast();
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(30);
  const [recurring, setRecurring] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!slotStart) return null;
  const start = slotStart;

  const localStart = DateTime.fromJSDate(start, { zone: officeTimeZone });
  const minutesUntilClose = WORK_END_HOUR * 60 - (localStart.hour * 60 + localStart.minute);
  const availableDurations = DURATION_OPTIONS_MINUTES.filter(
    (minutes) => minutes <= minutesUntilClose,
  );

  const displayStart = DateTime.fromJSDate(start, { zone: userTimeZone });
  const displayEnd = displayStart.plus({ minutes: duration });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFieldErrors({});
    setFormError(null);

    const endAt = new Date(start.getTime() + duration * 60_000);

    try {
      await postJson<{ booking?: BookingSlot; bookings?: BookingSlot[] }>(
        `/api/rooms/${roomId}/bookings`,
        {
          title,
          startAt: start.toISOString(),
          endAt: endAt.toISOString(),
          recurring,
        },
      );
      showToast(
        recurring
          ? `Бронювання створено на ${RECURRING_WEEKS} тижнів.`
          : "Бронювання створено.",
      );
      onCreated();
      onClose();
    } catch (error) {
      const apiError = error as ApiErrorPayload;
      const fields = apiError.fields ?? {};
      setFieldErrors(fields);
      if (Object.keys(fields).length === 0) setFormError(apiError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Нове бронювання">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {formError && <ErrorBanner message={formError} />}

        <p className="text-sm text-muted">
          {displayStart.setLocale("uk").toFormat("EEEE, d MMMM · HH:mm")}–
          {displayEnd.toFormat("HH:mm")}
        </p>

        <Field label="Назва бронювання" htmlFor="booking-title" error={fieldErrors.title}>
          <Input
            id="booking-title"
            autoFocus
            invalid={Boolean(fieldErrors.title)}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={100}
            required
          />
        </Field>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-foreground">Тривалість</span>
          <select
            value={duration}
            onChange={(event) => setDuration(Number(event.target.value))}
            className="focus-ring h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
          >
            {availableDurations.map((minutes) => (
              <option key={minutes} value={minutes}>
                {formatDuration(minutes)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={recurring}
            onChange={(event) => setRecurring(event.target.checked)}
            className="focus-ring h-4 w-4 rounded border-border accent-accent"
          />
          Повторювати щотижня ({RECURRING_WEEKS} разів)
        </label>

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Скасувати
          </Button>
          <Button type="submit" loading={submitting}>
            Забронювати
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
