declare module "@supabase/auth-helpers-nextjs" {
  import type { SupabaseClient } from "@supabase/supabase-js";

  export function createClientComponentClient<Database = any>(): SupabaseClient<Database>;
  export function createServerComponentClient<Database = any>(options?: any): SupabaseClient<Database>;
  export function createRouteHandlerClient<Database = any>(options?: any): SupabaseClient<Database>;
  export function createMiddlewareClient<Database = any>(options?: any): SupabaseClient<Database>;
}
