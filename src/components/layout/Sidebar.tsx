"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { DoorIcon, ListIcon, LogoutIcon } from "@/components/icons";

type SidebarProps = {
  user: { id: string; name: string };
};

const NAV_ITEMS = [
  { href: "/rooms", label: "Кімнати", icon: DoorIcon },
  { href: "/bookings", label: "Мої бронювання", icon: ListIcon },
];

export function Sidebar({ user }: SidebarProps) {
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
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface px-3 py-5 md:flex">
      <Link
        href="/rooms"
        className="focus-ring mb-8 rounded-md px-2 text-base font-semibold text-foreground"
      >
        Переговорні
      </Link>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname?.startsWith(item.href) ?? false;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`focus-ring flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted hover:bg-background hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3 border-t border-border pt-4">
        <span className="truncate px-2 text-sm text-muted">{user.name}</span>
        <Button
          variant="ghost"
          size="sm"
          loading={loggingOut}
          onClick={handleLogout}
          className="justify-start gap-2.5 px-2"
        >
          <LogoutIcon className="h-5 w-5" />
          Вийти
        </Button>
      </div>
    </aside>
  );
}
