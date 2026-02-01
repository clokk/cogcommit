/**
 * Supabase client factories for different environments
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient, createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";

// Environment variable names
const SUPABASE_URL_KEY = "NEXT_PUBLIC_SUPABASE_URL";
const SUPABASE_ANON_KEY_KEY = "NEXT_PUBLIC_SUPABASE_ANON_KEY";

/**
 * Get Supabase URL from environment
 */
export function getSupabaseUrl(): string {
  const url =
    process.env[SUPABASE_URL_KEY] || process.env.COGCOMMIT_SUPABASE_URL || "";
  if (!url) {
    throw new Error(
      `Supabase URL not configured. Set ${SUPABASE_URL_KEY} or COGCOMMIT_SUPABASE_URL environment variable.`
    );
  }
  return url;
}

/**
 * Get Supabase anon key from environment
 */
export function getSupabaseAnonKey(): string {
  const key =
    process.env[SUPABASE_ANON_KEY_KEY] ||
    process.env.COGCOMMIT_SUPABASE_ANON_KEY ||
    "";
  if (!key) {
    throw new Error(
      `Supabase anon key not configured. Set ${SUPABASE_ANON_KEY_KEY} or COGCOMMIT_SUPABASE_ANON_KEY environment variable.`
    );
  }
  return key;
}

/**
 * Create a Supabase client for browser usage
 * Uses @supabase/ssr for proper cookie handling
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());
}

/**
 * Cookie getter/setter types for server-side usage
 */
export interface CookieStore {
  get: (name: string) => { name: string; value: string } | undefined;
  set: (name: string, value: string, options?: CookieOptions) => void;
  remove: (name: string, options?: CookieOptions) => void;
}

/**
 * Create a Supabase client for server-side usage (Next.js Server Components, Route Handlers)
 * Requires passing in cookie accessors from Next.js
 */
export function createSupabaseServerClient(cookieStore: CookieStore) {
  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options?: CookieOptions) {
        try {
          cookieStore.set(name, value, options);
        } catch {
          // Server Component - can't set cookies
        }
      },
      remove(name: string, options?: CookieOptions) {
        try {
          cookieStore.remove(name, options);
        } catch {
          // Server Component - can't remove cookies
        }
      },
    },
  });
}

/**
 * Create a basic Supabase client (for CLI or non-SSR usage)
 */
export function createBasicSupabaseClient(): SupabaseClient {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Create a Supabase client with a specific access token
 */
export function createSupabaseClientWithToken(
  accessToken: string
): SupabaseClient {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  try {
    getSupabaseUrl();
    getSupabaseAnonKey();
    return true;
  } catch {
    return false;
  }
}
