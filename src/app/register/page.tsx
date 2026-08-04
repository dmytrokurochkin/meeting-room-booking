"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { postJson, type ApiErrorPayload } from "@/lib/api";
import type { PublicUser } from "@/shared/types";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFieldErrors({});
    setFormError(null);

    try {
      await postJson<{ user: PublicUser }>("/api/auth/register", { name, email, password });
      router.push("/rooms");
      router.refresh();
    } catch (error) {
      const apiError = error as ApiErrorPayload;
      const fields = apiError.fields ?? {};
      setFieldErrors(fields);
      if (Object.keys(fields).length === 0) setFormError(apiError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 py-12">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-xl font-semibold text-foreground">Реєстрація</h1>
        <p className="text-sm text-muted">Створіть акаунт, щоб бронювати переговорні.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {formError && <ErrorBanner message={formError} />}

        <Field label="Ім'я" htmlFor="name" error={fieldErrors.name}>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            invalid={Boolean(fieldErrors.name)}
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </Field>

        <Field label="Email" htmlFor="email" error={fieldErrors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            invalid={Boolean(fieldErrors.email)}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </Field>

        <Field label="Пароль" htmlFor="password" error={fieldErrors.password}>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            invalid={Boolean(fieldErrors.password)}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            maxLength={72}
            required
          />
        </Field>

        <Button type="submit" loading={submitting} className="mt-2 w-full">
          Зареєструватися
        </Button>
      </form>

      <p className="text-center text-sm text-muted">
        Вже маєте акаунт?{" "}
        <Link href="/login" className="focus-ring rounded-md text-accent hover:text-accent-hover">
          Увійти
        </Link>
      </p>
    </div>
  );
}
