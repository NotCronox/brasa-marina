import { isSupabaseConfigured } from './supabase-config.js';
import { getSupabaseClient } from './supabase-client.js';

const ADMIN_SESSION_KEY = 'brasa_marina_admin_session_v1';

function readLocalSession() {
  const raw = sessionStorage.getItem(ADMIN_SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (error) {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    return null;
  }
}

export async function signInAdmin(email, password) {
  if (!email?.trim() || !password?.trim()) {
    throw new Error('Completa email y contraseña.');
  }

  if (isSupabaseConfigured()) {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (error) throw new Error(error.message || 'No pudimos iniciar sesión.');
    return data.session;
  }

  const session = {
    createdAt: new Date().toISOString(),
    email: email.trim(),
    mode: 'demo-local'
  };
  sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function getAdminSession() {
  if (isSupabaseConfigured()) {
    const supabase = await getSupabaseClient();
    const { data } = await supabase.auth.getSession();
    return data.session;
  }

  return readLocalSession();
}

export async function requireAdmin(loginPath = '../login/') {
  const session = await getAdminSession();
  if (!session) {
    window.location.href = loginPath;
    return null;
  }
  return session;
}

export async function signOutAdmin(loginPath = '../login/') {
  if (isSupabaseConfigured()) {
    const supabase = await getSupabaseClient();
    await supabase.auth.signOut();
  }

  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  window.location.href = loginPath;
}
