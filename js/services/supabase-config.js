export const SUPABASE_CONFIG = {
  url: 'https://zkayzgmuczgokzywhshu.supabase.co',
  anonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprYXl6Z211Y3pnb2t6eXdoc2h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2OTc4NTQsImV4cCI6MjEwNTI3Mzg1NH0.x2IWQOlRw0T5iQ5v3RC6LDqSRic2wwe-iMt0wWpwkhs'
};

// El sitio de demostración (brasamarina-demo.pages.dev) no usa Supabase: cada visitante
// prueba el sitio y el panel con datos de ejemplo guardados en su propio navegador.
export const IS_DEMO_SITE = (globalThis.location?.hostname ?? '').endsWith('-demo.pages.dev');

export const isSupabaseConfigured = () =>
  !IS_DEMO_SITE && Boolean(SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey);
