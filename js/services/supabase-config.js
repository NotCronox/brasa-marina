export const SUPABASE_CONFIG = {
  url: '',
  anonKey: ''
};

export const isSupabaseConfigured = () =>
  Boolean(SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey);
