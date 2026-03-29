import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Browser client — bruk i Client Components ('use client')
export function createClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}
