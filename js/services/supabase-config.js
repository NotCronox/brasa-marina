export const SUPABASE_CONFIG = {
  url: 'https://zkayzgmuczgokzywhshu.supabase.co',
  anonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprYXl6Z211Y3pnb2t6eXdoc2h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2OTc4NTQsImV4cCI6MjEwNTI3Mzg1NH0.x2IWQOlRw0T5iQ5v3RC6LDqSRic2wwe-iMt0wWpwkhs'
};

export const isSupabaseConfigured = () =>
  Boolean(SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey);
