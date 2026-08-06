import { z } from "zod";
import { TITLE_MAX_LENGTH, TITLE_MIN_LENGTH } from "@/domain/booking-rules";

// Trimmed and lowercased so "Ivan@x.com" and " ivan@x.com " resolve to the same account.
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Введіть email.")
  .email("Введіть коректний email.");

export const nameSchema = z.string().trim().min(1, "Введіть ім'я.");

export const passwordSchema = z
  .string()
  .min(8, "Пароль має містити щонайменше 8 символів.")
  .max(72, "Пароль занадто довгий (максимум 72 символи).");

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Введіть пароль."),
});

export const createBookingSchema = z.object({
  title: z
    .string()
    .trim()
    .min(TITLE_MIN_LENGTH, "Введіть назву бронювання.")
    .max(TITLE_MAX_LENGTH, `Назва не може перевищувати ${TITLE_MAX_LENGTH} символів.`),
  startAt: z.coerce.date({ error: "Вкажіть коректний час початку." }),
  endAt: z.coerce.date({ error: "Вкажіть коректний час завершення." }),
  recurring: z.boolean().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
