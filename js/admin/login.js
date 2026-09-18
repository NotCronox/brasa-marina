import { getAdminSession, signInAdmin } from '../services/auth-service.js';
import { isSupabaseConfigured } from '../services/supabase-config.js';
import { getDataModeLabel } from '../services/supabase-client.js';

const DEMO_CREDENTIALS = { email: 'admin@brasamarina.co', password: 'demo1234' };

const form = document.querySelector('#adminLoginForm');
const message = document.querySelector('#loginMessage');
const mode = document.querySelector('#loginMode');
const demoButton = document.querySelector('#demoLoginBtn');
const demoHint = document.querySelector('#demoHint');

if (mode) mode.textContent = getDataModeLabel();

if (isSupabaseConfigured()) {
  demoButton?.remove();
  if (demoHint) {
    demoHint.innerHTML = `
      <strong>¿Cómo entro?</strong>
      <p>Este proyecto está conectado a Supabase. Usa el usuario creado en Supabase Auth y registrado en <code>admin_profiles</code>.</p>
    `;
  }
}

const existingSession = await getAdminSession();
if (existingSession) {
  window.location.href = '../dashboard/';
}

function showError(error) {
  if (!message) return;
  message.textContent = error.message || 'No pudimos iniciar sesión.';
  message.hidden = false;
}

async function submitCredentials(email, password) {
  if (message) message.hidden = true;

  try {
    await signInAdmin(email, password);
    window.location.href = '../dashboard/';
  } catch (error) {
    showError(error);
  }
}

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form);
  submitCredentials(data.get('email'), data.get('password'));
});

demoButton?.addEventListener('click', () => {
  form.querySelector('[name="email"]').value = DEMO_CREDENTIALS.email;
  form.querySelector('[name="password"]').value = DEMO_CREDENTIALS.password;
  submitCredentials(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password);
});
