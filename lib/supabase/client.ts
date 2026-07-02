import { createClient } from "@supabase/supabase-js";
import { normalizeSupabaseUrl } from "./url";

function getRequiredPublicEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing required public Supabase environment variable: ${name}. Add it to .env.local.`,
    );
  }

  return value;
}

export function createBrowserSupabaseClient() {
  const supabaseUrl = normalizeSupabaseUrl(
    getRequiredPublicEnv("NEXT_PUBLIC_SUPABASE_URL"),
  );
  const supabaseAnonKey = getRequiredPublicEnv(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  );

  return createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = createBrowserSupabaseClient();
