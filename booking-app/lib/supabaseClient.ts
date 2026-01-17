import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, 
    {
    auth: {
      persistSession: true,       // 🔴 חובה
      autoRefreshToken: true,     // 🔴 חובה
      detectSessionInUrl: true    // 🔴 חובה (OAuth / magic link)
    }
  }
)
