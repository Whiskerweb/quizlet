import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// Singleton instance
let supabaseInstance: SupabaseClient | null = null;

export function createClient() {
  // Return existing instance if it exists
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Create new instance
  supabaseInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // Get cookie from document.cookie
          if (typeof document === 'undefined') return undefined;
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) {
            return parts.pop()?.split(';').shift();
          }
        },
        set(name: string, value: string, options: any) {
          // Set cookie in document.cookie
          if (typeof document === 'undefined') return;
          let cookieString = `${name}=${value}`;
          
          if (options?.maxAge) {
            cookieString += `; max-age=${options.maxAge}`;
          }
          if (options?.path) {
            cookieString += `; path=${options.path}`;
          }
          if (options?.domain) {
            cookieString += `; domain=${options.domain}`;
          }
          if (options?.sameSite) {
            cookieString += `; samesite=${options.sameSite}`;
          }
          if (options?.secure) {
            cookieString += '; secure';
          }
          
          document.cookie = cookieString;
        },
        remove(name: string, options: any) {
          // Remove cookie by setting expiration to the past
          if (typeof document === 'undefined') return;
          let cookieString = `${name}=; max-age=0`;
          
          if (options?.path) {
            cookieString += `; path=${options.path}`;
          }
          if (options?.domain) {
            cookieString += `; domain=${options.domain}`;
          }
          
          document.cookie = cookieString;
        },
      },
    }
  );

  return supabaseInstance;
}













