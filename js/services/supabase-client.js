import { SUPABASE_CONFIG, isSupabaseConfigured } from './supabase-config.js';

let cachedClient = null;

export async function getSupabaseClient() {
  if (!isSupabaseConfigured()) return null;
  if (cachedClient) return cachedClient;

  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
  cachedClient = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
  return cachedClient;
}

export function getDataModeLabel() {
  return isSupabaseConfigured() ? 'Supabase conectado' : 'Modo demo local';
}
