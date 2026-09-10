/**
 * IMPACTMESH - Supabase Client
 * Initializes the Supabase client instance using validated environment variables.
 * Safe for client-side consumption; never exposes service role keys.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types.ts';
import { env } from '../../config/env.ts';

// Fallback dummy client values for build-time safety and graceful offline initialization
const DEFAULT_URL = 'https://placeholder-project.supabase.co';
const DEFAULT_KEY = 'placeholder-anon-key';

const targetUrl = env.supabaseUrl || DEFAULT_URL;
const targetKey = env.supabaseAnonKey || DEFAULT_KEY;

export const supabase: SupabaseClient<Database> = createClient<Database>(
  targetUrl,
  targetKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

export const checkSupabaseConnection = async (): Promise<{
  connected: boolean;
  message: string;
}> => {
  if (!env.isSupabaseConfigured) {
    return {
      connected: false,
      message: 'Supabase credentials not configured in environment (.env).',
    };
  }

  try {
    const { error } = await supabase.from('organizations').select('id').limit(1);
    if (error) {
      return {
        connected: false,
        message: `Supabase connection check failed: ${error.message}`,
      };
    }
    return {
      connected: true,
      message: 'Supabase connected successfully.',
    };
  } catch (err) {
    return {
      connected: false,
      message: err instanceof Error ? err.message : 'Unknown connection error',
    };
  }
};
