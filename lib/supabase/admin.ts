import "server-only";

import { createClient } from "@supabase/supabase-js";
import { normalizeSupabaseUrl } from "./url";

function getRequiredServerEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing required server-only Supabase environment variable: ${name}. Add it to .env.local on the server. Never expose this value to the browser.`,
    );
  }

  return value;
}

export function createSupabaseAdminClient() {
  const supabaseUrl = normalizeSupabaseUrl(
    getRequiredServerEnv("NEXT_PUBLIC_SUPABASE_URL"),
  );
  const serviceRoleKey = getRequiredServerEnv("SUPABASE_SERVICE_ROLE_KEY");

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Import this only from Server Components, Server Actions, Route Handlers, or other server-only modules.
// The `server-only` import above prevents accidental use from Client Components.
export const supabaseAdmin = createSupabaseAdminClient();
