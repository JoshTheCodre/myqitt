'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Browser-only Supabase client
 * 🚨 This file must never be imported into Server Components
 */

let supabaseInstance: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance
  }

  supabaseInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  )

  return supabaseInstance
}

// For backwards compatibility - exports the singleton
export const supabase = getSupabaseClient()
export default supabase
