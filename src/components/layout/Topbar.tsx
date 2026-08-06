"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ClockIcon, LogoutIcon } from "@/components/icons";
import { useUserTimeZone } from "@/hooks/useUserTimeZone";

type TopbarProps = {
  user: { id: string; name: string };
};

const NAV_ITEMS = [
  { href: "/rooms", label: "Кімнати" },
  { href: "/bookings", label: "Мої" },
];

function pageTitle(pathname: string | null): string {
  if (!pathname) return "";
  if (pathname === "/rooms") return "Переговорні кімнати";
  if (pathname.startsWith("/rooms/")) return "Розклад кімнати";
  if (pathname.startsWith("/bookings")) return "Мої бронювання";
  return "";
}

function TimeZoneBadge({ className = "" }: { className?: string }) {
  const timeZone = useUserTimeZone();
  return (
    <span className={`flex items-center gap-1.5 text-muted ${className}`}>
      <ClockIcon className="h-4 w-4 shrink-0" />
      {timeZone}
    </span>
  );
}

export function Topbar({ user }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface">
      {/* Mobile: compact bar with logo, nav and logout */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 md:hidden">
        <Link href="/rooms" className="focus-ring rounded-md text-sm font-semibold text-foreground">
          Переговорні
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          {NAV_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href) ?? false;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`focus-ring rounded-md px-1 font-medium ${
                  active ? "text-accent" : "text-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Button variant="ghost" size="sm" loading={loggingOut} onClick={handleLogout}>
          <LogoutIcon className="h-4 w-4" />
        </Button>
      </div>
      <div className="border-t border-border px-4 py-1.5 text-xs md:hidden">
        <TimeZoneBadge />
      </div>

      {/* Desktop: page title + timezone + user name */}
      <div className="hidden items-center justify-between px-6 py-4 md:flex">
        <h1 className="text-lg font-semibold text-foreground">{pageTitle(pathname)}</h1>
        <div className="flex items-center gap-5 text-sm">
          <TimeZoneBadge />
          <span className="font-medium text-foreground">{user.name}</span>
        </div>
      </div>
    </header>
  );
}
