import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

type SupabaseStorage = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

const createSafeStorage = (): SupabaseStorage => {
  const memory = new Map<string, string>()

  const canUseLocalStorage = (): boolean => {
    try {
      if (typeof window === 'undefined') return false
      if (!('localStorage' in window)) return false
      const k = '__storage_test__'
      window.localStorage.setItem(k, '1')
      window.localStorage.removeItem(k)
      return true
    } catch {
      return false
    }
  }

  const useLocalStorage = canUseLocalStorage()

  return {
    getItem: (key) => {
      try {
        if (useLocalStorage) return window.localStorage.getItem(key)
      } catch {}
      return memory.get(key) ?? null
    },
    setItem: (key, value) => {
      try {
        if (useLocalStorage) {
          window.localStorage.setItem(key, value)
          return
        }
      } catch {}
      memory.set(key, value)
    },
    removeItem: (key) => {
      try {
        if (useLocalStorage) {
          window.localStorage.removeItem(key)
          return
        }
      } catch {}
      memory.delete(key)
    },
  }
}

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
        storage: createSafeStorage(),
        persistSession: true,
        autoRefreshToken: true,
      },
    }) as SupabaseClient
  }
  return g.__supabase as SupabaseClient
}

export const supabase = createSingletonClient()
