import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let supabaseInstance = null;

export function getSupabase() {
  if (!isSupabaseConfigured) {
    console.warn('⚠️ Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local');
    // Return a proxy that logs warnings for any property access/call
    return new Proxy({}, {
      get: (target, prop) => {
        const mockMethods = {
          from: () => ({
            select: () => ({ order: () => ({ limit: () => Promise.resolve({ data: [], error: null }), eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }), eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }),
            insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
            update: () => ({ eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) }),
            delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
          }),
          auth: {
            getUser: () => Promise.resolve({ data: { user: null }, error: null }),
            signInWithPassword: () => Promise.reject('Supabase not configured'),
            signUp: () => Promise.reject('Supabase not configured'),
            signOut: () => Promise.resolve(),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
            updateUser: () => Promise.resolve({ data: {}, error: null }),
          },
          storage: {
            from: () => ({
              upload: () => Promise.reject('Supabase not configured'),
              getPublicUrl: () => ({ data: { publicUrl: '' } }),
            }),
          },
        };
        return mockMethods[prop] || (() => ({ data: null, error: null }));
      }
    });
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return supabaseInstance;
}

export const supabase = isSupabaseConfigured ? getSupabase() : null;
