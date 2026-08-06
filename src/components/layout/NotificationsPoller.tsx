"use client";

import { useApi } from "@/lib/use-api";
import { useToast } from "@/components/ui/Toast";

const POLL_INTERVAL_MS = 60_000;

type NotificationsResponse = {
  notifications: { id: string; message: string }[];
};

/**
 * Renders nothing, just polls for booking-ending-soon notifications while
 * mounted and toasts any newly-delivered ones. The onSuccess callback (an SWR
 * hook, not a React effect) is what reacts to new data, so this sidesteps the
 * "no setState directly in an effect" lint rule that a useEffect here would
 * have hit.
 */
export function NotificationsPoller() {
  const { showToast } = useToast();

  useApi<NotificationsResponse>("/api/notifications", {
    refreshInterval: POLL_INTERVAL_MS,
    onSuccess: (data) => {
      for (const notification of data.notifications) {
        showToast(notification.message, "success");
      }
    },
  });

  return null;
}
