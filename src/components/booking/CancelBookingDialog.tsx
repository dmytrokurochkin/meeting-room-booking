"use client";

import { DateTime } from "luxon";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { useToast } from "@/components/ui/Toast";
import { deleteJson, type ApiErrorPayload } from "@/lib/api";

export type CancelTarget = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  seriesId?: string | null;
};

type CancelBookingDialogProps = {
  booking: CancelTarget | null;
  timeZone: string;
  onClose: () => void;
  onCancelled: () => void;
};

type CancelScope = "single" | "series";

export function CancelBookingDialog({
  booking,
  timeZone,
  onClose,
  onCancelled,
}: CancelBookingDialogProps) {
  const { showToast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [submittingScope, setSubmittingScope] = useState<CancelScope | null>(null);

  if (!booking) return null;
  const target = booking;
  const isRecurring = Boolean(target.seriesId);

  const start = DateTime.fromISO(target.startAt, { zone: timeZone });
  const end = DateTime.fromISO(target.endAt, { zone: timeZone });

  async function handleConfirm(scope: CancelScope) {
    setSubmittingScope(scope);
    setError(null);
    try {
      await deleteJson(`/api/bookings/${target.id}?scope=${scope}`);
      showToast(scope === "series" ? "Серію бронювань скасовано." : "Бронювання скасовано.");
      onCancelled();
      onClose();
    } catch (err) {
      setError((err as ApiErrorPayload).message);
    } finally {
      setSubmittingScope(null);
    }
  }

  return (
    <Dialog open={booking !== null} onClose={onClose} title="Скасувати бронювання?">
      <div className="flex flex-col gap-4">
        {error && <ErrorBanner message={error} />}

        <div className="text-sm text-foreground">
          <p className="font-medium">{target.title}</p>
          <p className="text-muted">
            {start.setLocale("uk").toFormat("EEEE, d MMMM · HH:mm")}–{end.toFormat("HH:mm")}
          </p>
        </div>

        <p className="text-sm text-muted">
          {isRecurring
            ? "Це повторюване бронювання. Цю дію не можна скасувати."
            : "Цю дію не можна скасувати."}
        </p>

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Залишити
          </Button>
          {isRecurring && (
            <Button
              variant="danger"
              loading={submittingScope === "series"}
              disabled={submittingScope === "single"}
              onClick={() => handleConfirm("series")}
            >
              Скасувати всю серію
            </Button>
          )}
          <Button
            variant="danger"
            loading={submittingScope === "single"}
            disabled={submittingScope === "series"}
            onClick={() => handleConfirm("single")}
          >
            {isRecurring ? "Скасувати тільки цю" : "Скасувати бронювання"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
