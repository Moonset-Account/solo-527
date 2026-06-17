import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

let clientInstance: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    if (!clientInstance) {
      clientInstance = createBrowserClient(
        "https://placeholder.supabase.co",
        "placeholder-key"
      );
    }
    return clientInstance;
  }
  if (!clientInstance) {
    clientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return clientInstance;
}
