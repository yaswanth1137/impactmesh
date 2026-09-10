/**
 * IMPACTMESH - Client Environment Configuration
 * Validates and exposes safe client-side environment variables.
 * Server keys (Groq API Key, Supabase Service Role) are strictly isolated from this module.
 */

interface ClientEnvironmentConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isSupabaseConfigured: boolean;
  groqApiKey: string;
  groqModel: string;
  isGroqConfigured: boolean;
  isDevelopment: boolean;
}

const getEnv = (key: string): string => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] || '';
  }
  const meta = import.meta as unknown as { env?: Record<string, string> };
  if (meta && meta.env && meta.env[key]) {
    return meta.env[key] || '';
  }
  return '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('SUPABASE_ANON_KEY');
const groqApiKey = getEnv('VITE_GROQ_API_KEY') || getEnv('GROQ_API_KEY');
const groqModel = getEnv('VITE_GROQ_MODEL') || getEnv('GROQ_MODEL') || 'llama-3.3-70b-versatile';

const isSupabaseConfigured =
  Boolean(supabaseUrl) &&
  Boolean(supabaseAnonKey) &&
  !supabaseUrl.includes('placeholder-project') &&
  !supabaseUrl.includes('xyzcompany') &&
  !supabaseAnonKey.includes('placeholder-anon-key') &&
  !supabaseAnonKey.includes('example_anon_key');

const isGroqConfigured =
  Boolean(groqApiKey) &&
  !groqApiKey.includes('placeholder') &&
  groqApiKey.startsWith('gsk_');

export const env: ClientEnvironmentConfig = {
  supabaseUrl,
  supabaseAnonKey,
  isSupabaseConfigured,
  groqApiKey,
  groqModel,
  isGroqConfigured,
  isDevelopment: import.meta.env?.DEV ?? true,
};
