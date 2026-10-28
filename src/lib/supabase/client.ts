import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder_key";

/**
 * Browser Supabase client.
 *
 * The session lives in cookies (via @supabase/ssr) so the proxy and server
 * actions see the same signed-in user. Every request carries the user's JWT,
 * which is what row level security policies evaluate.
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
