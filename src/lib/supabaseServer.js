import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client using the service role key.
// This bypasses Row Level Security (RLS) and should only be used
// in server-side code (API routes, Inngest functions, etc.).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseServer =
  supabaseUrl && supabaseServiceKey && supabaseUrl.startsWith("http")
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;
