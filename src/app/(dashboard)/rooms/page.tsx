import { RoomsBrowser } from "@/app/(dashboard)/rooms/RoomsBrowser";

export default function RoomsPage() {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted">Оберіть кімнату, щоб побачити розклад на тиждень.</p>
      <RoomsBrowser />
    </div>
  );
}
