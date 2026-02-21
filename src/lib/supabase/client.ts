import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const createThrowingClient = (): SupabaseClient => {
  const handler: ProxyHandler<any> = {
    get() {
      throw new Error('Missing Supabase environment variables')
    },
    apply() {
      throw new Error('Missing Supabase environment variables')
    },
  }
  return new Proxy(() => {}, handler) as unknown as SupabaseClient
}

const createSingletonClient = (): SupabaseClient => {
  if (!url || !anonKey) {
    return createThrowingClient()
  }
  const g = globalThis as any
  if (!g.__supabase) {
    g.__supabase = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    }) as SupabaseClient
  }
  return g.__supabase as SupabaseClient
}

export const supabase = createSingletonClient()
