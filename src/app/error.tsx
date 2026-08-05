"use client";

import { useEffect } from "react";
import { ErrorBanner } from "@/components/ui/ErrorBanner";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
      <ErrorBanner message="Щось пішло не так. Спробуйте ще раз." onRetry={reset} />
    </div>
  );
}
