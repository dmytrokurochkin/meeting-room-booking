import useSWR, { type SWRConfiguration } from "swr";
import { getJson, type ApiErrorPayload } from "@/lib/api";

export function useApi<T>(key: string | null, config?: SWRConfiguration<T, ApiErrorPayload>) {
  return useSWR<T, ApiErrorPayload>(key, (url: string) => getJson<T>(url), config);
}
