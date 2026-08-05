import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
      <EmptyState
        title="Сторінку не знайдено"
        description="Можливо, її видалили або посилання неправильне."
        action={
          <Link href="/rooms">
            <Button size="sm">До кімнат</Button>
          </Link>
        }
      />
    </div>
  );
}
