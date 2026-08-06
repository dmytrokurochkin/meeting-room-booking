import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/session";
import { EmailVerificationBanner } from "@/components/layout/EmailVerificationBanner";
import { NotificationsPoller } from "@/components/layout/NotificationsPoller";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const publicUser = { id: user.id, name: user.name };

  return (
    <div className="flex min-h-screen">
      <NotificationsPoller />
      <Sidebar user={publicUser} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={publicUser} />
        {!user.emailVerifiedAt && <EmailVerificationBanner />}
        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 md:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
