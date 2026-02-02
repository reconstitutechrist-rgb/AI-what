import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

const DEV_BYPASS_AUTH =
  process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true';

/**
 * Check if Supabase is properly configured (not placeholder values)
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  return (
    url.length > 0 && key.length > 0 && !url.includes('placeholder') && !key.includes('placeholder')
  );
}

export function createClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    if (DEV_BYPASS_AUTH) {
      return null;
    }
    throw new Error(
      `Missing Supabase environment variables.\n` +
        `URL: ${url ? 'Set' : 'MISSING'}\n` +
        `Key: ${key ? 'Set' : 'MISSING'}\n` +
        `Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in Vercel.`
    );
  }

  return createBrowserClient(url, key);
}
