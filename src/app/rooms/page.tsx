import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/session";
import { RoomsBrowser } from "@/app/rooms/RoomsBrowser";

export default async function RoomsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Переговорні кімнати</h1>
        <p className="text-sm text-muted">Оберіть кімнату, щоб побачити розклад на тиждень.</p>
      </div>
      <RoomsBrowser />
    </div>
  );
}
