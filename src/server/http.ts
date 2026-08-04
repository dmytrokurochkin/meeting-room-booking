import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "EMAIL_TAKEN"
  | "INVALID_CREDENTIALS"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "SLOT_TAKEN"
  | "OUTSIDE_WORK_HOURS"
  | "IN_THE_PAST"
  | "TOO_SHORT"
  | "TOO_LONG"
  | "NOT_SLOT_ALIGNED"
  | "INTERNAL_ERROR";

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 400,
  EMAIL_TAKEN: 409,
  INVALID_CREDENTIALS: 401,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SLOT_TAKEN: 409,
  OUTSIDE_WORK_HOURS: 422,
  IN_THE_PAST: 422,
  TOO_SHORT: 422,
  TOO_LONG: 422,
  NOT_SLOT_ALIGNED: 422,
  INTERNAL_ERROR: 500,
};

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly fields?: Record<string, string>;

  constructor(code: ApiErrorCode, message: string, fields?: Record<string, string>) {
    super(message);
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.fields = fields;
  }
}

function fieldsFromZodError(error: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_root";
    if (!fields[key]) fields[key] = issue.message;
  }
  return fields;
}

function toResponse(error: ApiError): NextResponse {
  return NextResponse.json(
    { error: { code: error.code, message: error.message, fields: error.fields } },
    { status: error.status },
  );
}

/**
 * Wraps a Next.js route handler so every thrown ApiError or ZodError is turned
 * into the same JSON error shape, instead of each route handling it by hand.
 */
export function apiRoute<Args extends unknown[]>(
  handler: (request: Request, ...args: Args) => Promise<Response>,
) {
  return async (request: Request, ...args: Args): Promise<Response> => {
    try {
      return await handler(request, ...args);
    } catch (error) {
      if (error instanceof ApiError) return toResponse(error);
      if (error instanceof ZodError) {
        return toResponse(
          new ApiError(
            "VALIDATION_ERROR",
            "Перевірте правильність заповнення форми.",
            fieldsFromZodError(error),
          ),
        );
      }
      console.error(error);
      return toResponse(new ApiError("INTERNAL_ERROR", "Щось пішло не так. Спробуйте ще раз."));
    }
  };
}

export async function parseJsonBody<T>(request: Request, schema: ZodType<T>): Promise<T> {
  const body = await request.json().catch(() => {
    throw new ApiError("VALIDATION_ERROR", "Некоректний формат запиту.");
  });
  return schema.parseAsync(body);
}
