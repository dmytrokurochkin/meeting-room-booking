"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { postJson } from "@/lib/api";

export function EmailVerificationBanner() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleResend() {
    setSending(true);
    try {
      await postJson("/api/auth/resend-verification", {});
      setSent(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface-secondary px-4 py-2.5 text-sm text-foreground md:px-6">
      <span>Підтвердіть email, щоб бронювати кімнати. Посилання виведено в лог сервера.</span>
      <Button
        variant="outline"
        size="sm"
        loading={sending}
        disabled={sent}
        onClick={handleResend}
        className="shrink-0"
      >
        {sent ? "Надіслано" : "Надіслати ще раз"}
      </Button>
    </div>
  );
}
