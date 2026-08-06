import { MyBookingsView } from "@/app/(dashboard)/bookings/MyBookingsView";

export default function MyBookingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted">Список ваших бронювань переговорних кімнат.</p>
      <MyBookingsView />
    </div>
  );
}
