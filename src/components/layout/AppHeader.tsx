import Link from "next/link";
import { getSessionUser } from "@/server/session";
import { HeaderNav } from "@/components/layout/HeaderNav";

export async function AppHeader() {
  const user = await getSessionUser();

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-4">
        <Link
          href="/rooms"
          className="focus-ring shrink-0 truncate rounded-md text-sm font-semibold whitespace-nowrap text-foreground"
        >
          <span className="sm:hidden">Бронювання</span>
          <span className="hidden sm:inline">Бронювання переговорних</span>
        </Link>
        <HeaderNav user={user ? { id: user.id, name: user.name } : null} />
      </div>
    </header>
  );
}
