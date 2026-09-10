/**
 * IMPACTMESH - Client Environment Configuration
 * Validates and exposes safe client-side environment variables.
 * Server keys (Groq API Key, Supabase Service Role) are strictly isolated from this module.
 */

interface ClientEnvironmentConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isSupabaseConfigured: boolean;
  isDevelopment: boolean;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isSupabaseConfigured =
  Boolean(supabaseUrl) &&
  Boolean(supabaseAnonKey) &&
  !supabaseUrl.includes('placeholder-project') &&
  !supabaseAnonKey.includes('placeholder-anon-key');

if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.warn(
    '[IMPACTMESH Config Warning] Supabase client is not fully configured or using placeholders. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.'
  );
}

export const env: ClientEnvironmentConfig = {
  supabaseUrl,
  supabaseAnonKey,
  isSupabaseConfigured,
  isDevelopment: import.meta.env.DEV,
};
