import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn(
      "Supabase environment variables not set, some features may not work properly"
    );
  }

  return createClient<Database>(supabaseUrl || "", supabaseServiceKey || "", {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export { createServerClient as createClient };
