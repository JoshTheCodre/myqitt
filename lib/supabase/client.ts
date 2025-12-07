import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// ✅ FIXED: Proper auth configuration for session persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,        // Save session to localStorage
    autoRefreshToken: true,       // Auto-refresh before expiry
    detectSessionInUrl: true,     // Handle OAuth redirects
    storageKey: 'qitt-auth',     // Unique key to avoid conflicts
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
})

// Admin client for server-side operations (use only in server components or edge functions)
export const supabaseAdmin = supabaseServiceRoleKey 
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null

export default supabase
