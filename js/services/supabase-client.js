import { SUPABASE_CONFIG, isSupabaseConfigured } from './supabase-config.js';

let clientPromise = null;

export function getSupabaseClient() {
  if (!isSupabaseConfigured()) return Promise.resolve(null);

  // Cachea la PROMESA (no el resultado) para que llamadas concurrentes durante
  // la carga inicial de la página no disparen createClient() varias veces en
  // paralelo, lo que corrompe el manejo de sesión de supabase-js.
  if (!clientPromise) {
    clientPromise = import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm').then(({ createClient }) =>
      createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey)
    );
  }

  return clientPromise;
}

export function getDataModeLabel() {
  return isSupabaseConfigured() ? 'Supabase conectado' : 'Modo demo local';
}
