import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

// Client-side Supabase client (using fallbacks during build time to prevent compilation crash)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Server-side admin client to bypass RLS or run server-side actions
export function getSupabaseAdmin() {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // Only throw at runtime if this function is actually called and key is missing
  if (!supabaseServiceKey) {
    throw new Error("Missing Supabase environment variable SUPABASE_SERVICE_ROLE_KEY");
  }
  
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

