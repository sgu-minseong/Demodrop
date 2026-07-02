export function normalizeSupabaseUrl(value: string): string {
  return value.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
}
