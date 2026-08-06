import { notFound } from "next/navigation";
import { OFFICE_TIME_ZONE } from "@/domain/time";
import { getRoomById } from "@/server/services/rooms.service";
import { RoomSchedule } from "@/app/(dashboard)/rooms/[id]/RoomSchedule";

type RoomPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string }>;
};

export default async function RoomPage({ params, searchParams }: RoomPageProps) {
  const { id } = await params;
  const { date } = await searchParams;
  const room = await getRoomById(id);
  if (!room) notFound();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{room.name}</h2>
        <p className="text-sm text-muted">
          {room.floor} поверх · до {room.capacity} осіб
        </p>
      </div>
      <RoomSchedule room={room} officeTimeZone={OFFICE_TIME_ZONE} initialDate={date} />
    </div>
  );
}
