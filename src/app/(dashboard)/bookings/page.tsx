import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/session";
import { MyBookingsView } from "@/app/bookings/MyBookingsView";

export default async function MyBookingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Мої бронювання</h1>
        <p className="text-sm text-muted">Список ваших бронювань переговорних кімнат.</p>
      </div>
      <MyBookingsView />
    </div>
  );
}
