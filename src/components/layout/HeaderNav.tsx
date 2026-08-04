"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

type HeaderNavProps = {
  user: { id: string; name: string } | null;
};

function navLinkClass(active: boolean): string {
  return `focus-ring rounded-md px-1 ${active ? "font-medium text-foreground" : "text-muted hover:text-foreground"}`;
}

export function HeaderNav({ user }: HeaderNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (!user) {
    return (
      <nav className="flex items-center gap-2 text-sm">
        <Link
          href="/login"
          className="focus-ring rounded-md px-3 py-1.5 text-foreground hover:bg-background"
        >
          Увійти
        </Link>
        <Link
          href="/register"
          className="focus-ring rounded-md bg-accent px-3 py-1.5 text-accent-foreground hover:bg-accent-hover"
        >
          Реєстрація
        </Link>
      </nav>
    );
  }

  return (
    <nav className="flex items-center gap-4 text-sm">
      <Link href="/rooms" className={navLinkClass(pathname?.startsWith("/rooms") ?? false)}>
        Кімнати
      </Link>
      <Link href="/bookings" className={navLinkClass(pathname?.startsWith("/bookings") ?? false)}>
        Мої бронювання
      </Link>
      <span className="hidden text-muted sm:inline">{user.name}</span>
      <Button variant="ghost" size="sm" loading={loggingOut} onClick={handleLogout}>
        Вийти
      </Button>
    </nav>
  );
}
