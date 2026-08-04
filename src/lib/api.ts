export type ApiErrorPayload = {
  code: string;
  message: string;
  fields?: Record<string, string>;
};

async function request<T>(url: string, init: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    const error: ApiErrorPayload = {
      code: "NETWORK_ERROR",
      message: "Немає з'єднання із сервером. Перевірте мережу і спробуйте ще раз.",
    };
    throw error;
  }

  if (response.status === 204) return undefined as T;

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error: ApiErrorPayload = data?.error ?? {
      code: "INTERNAL_ERROR",
      message: "Щось пішло не так. Спробуйте ще раз.",
    };
    throw error;
  }

  return data as T;
}

export function postJson<T>(url: string, body: unknown): Promise<T> {
  return request<T>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function deleteJson<T>(url: string): Promise<T> {
  return request<T>(url, { method: "DELETE" });
}

export function getJson<T>(url: string): Promise<T> {
  return request<T>(url, { method: "GET" });
}
