"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { postJson, type ApiErrorPayload } from "@/lib/api";

type Status = "pending" | "success" | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("pending");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) return;
    postJson("/api/auth/verify-email", { token })
      .then(() => setStatus("success"))
      .catch((error) => {
        setStatus("error");
        setMessage((error as ApiErrorPayload).message);
      });
  }, [token]);

  const effectiveStatus: Status = token ? status : "error";
  const effectiveMessage = token ? message : "Посилання неповне: відсутній токен.";

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4 px-4 py-12 text-center">
      {effectiveStatus === "pending" && <p className="text-sm text-muted">Підтверджуємо email…</p>}

      {effectiveStatus === "success" && (
        <>
          <h1 className="text-xl font-semibold text-foreground">Email підтверджено</h1>
          <p className="text-sm text-muted">Тепер ви можете бронювати переговорні кімнати.</p>
        </>
      )}

      {effectiveStatus === "error" && (
        <>
          <h1 className="text-xl font-semibold text-foreground">Не вдалося підтвердити</h1>
          <p className="text-sm text-muted">{effectiveMessage}</p>
        </>
      )}

      {effectiveStatus !== "pending" && (
        <Link href="/rooms" className="self-center">
          <Button size="sm">До кімнат</Button>
        </Link>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
