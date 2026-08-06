"use client";

import Link from "next/link";
import { useState } from "react";
import { BuildingIcon, UsersIcon } from "@/components/icons";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import { useApi } from "@/lib/use-api";
import type { Room } from "@/shared/types";

const CAPACITY_OPTIONS = [
  { label: "Будь-яка місткість", value: "" },
  { label: "2+ осіб", value: "2" },
  { label: "4+ осіб", value: "4" },
  { label: "6+ осіб", value: "6" },
  { label: "10+ осіб", value: "10" },
];

export function RoomsBrowser() {
  const [minCapacity, setMinCapacity] = useState("");
  const query = minCapacity ? `?minCapacity=${encodeURIComponent(minCapacity)}` : "";
  const { data, error, isLoading, mutate } = useApi<{ rooms: Room[] }>(`/api/rooms${query}`);
  const rooms = data?.rooms ?? null;

  return (
    <div className="flex flex-col gap-4">
      <label className="flex w-fit flex-col gap-1.5 text-sm">
        <span className="font-medium text-foreground">Місткість</span>
        <select
          value={minCapacity}
          onChange={(event) => setMinCapacity(event.target.value)}
          className="focus-ring h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
        >
          {CAPACITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {error && <ErrorBanner message={error.message} onRetry={() => mutate()} />}

      {!error && isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
      )}

      {!error && rooms !== null && rooms.length === 0 && (
        <EmptyState
          icon={<BuildingIcon className="h-8 w-8" />}
          title="Кімнат не знайдено"
          description="Спробуйте обрати менший поріг місткості."
        />
      )}

      {!error && rooms !== null && rooms.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <Link
              key={room.id}
              href={`/rooms/${room.id}`}
              className="focus-ring group relative flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-base font-semibold text-foreground">{room.name}</span>
                <span
                  className="flex items-center gap-1.5 text-xs text-muted"
                  title={room.isFreeNow ? "Вільно зараз" : "Зайнято зараз"}
                >
                  <span
                    aria-hidden
                    className={`h-2.5 w-2.5 rounded-full ${
                      room.isFreeNow ? "bg-accent" : "bg-danger"
                    }`}
                  />
                  {room.isFreeNow ? "Вільно" : "Зайнято"}
                </span>
              </div>

              <div className="flex flex-col gap-1.5 text-sm text-muted">
                <span className="flex items-center gap-2">
                  <BuildingIcon className="h-4 w-4 shrink-0 text-accent-hover" />
                  {room.floor} поверх
                </span>
                <span className="flex items-center gap-2">
                  <UsersIcon className="h-4 w-4 shrink-0 text-accent-hover" />
                  До {room.capacity} осіб
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
