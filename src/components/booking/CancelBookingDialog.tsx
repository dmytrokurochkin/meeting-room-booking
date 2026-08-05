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
};

type CancelBookingDialogProps = {
  booking: CancelTarget | null;
  timeZone: string;
  onClose: () => void;
  onCancelled: () => void;
};

export function CancelBookingDialog({
  booking,
  timeZone,
  onClose,
  onCancelled,
}: CancelBookingDialogProps) {
  const { showToast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!booking) return null;
  const target = booking;

  const start = DateTime.fromISO(target.startAt, { zone: timeZone });
  const end = DateTime.fromISO(target.endAt, { zone: timeZone });

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    try {
      await deleteJson(`/api/bookings/${target.id}`);
      showToast("Бронювання скасовано.");
      onCancelled();
      onClose();
    } catch (err) {
      setError((err as ApiErrorPayload).message);
    } finally {
      setSubmitting(false);
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

        <p className="text-sm text-muted">Цю дію не можна скасувати.</p>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Залишити
          </Button>
          <Button variant="danger" loading={submitting} onClick={handleConfirm}>
            Скасувати бронювання
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
