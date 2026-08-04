"use client";

import { useSyncExternalStore } from "react";

function subscribe(): () => void {
  return () => {};
}

function getSnapshot(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function getServerSnapshot(): string {
  return "UTC";
}

/** Browser-detected IANA time zone, stable across SSR/hydration via useSyncExternalStore. */
export function useUserTimeZone(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
