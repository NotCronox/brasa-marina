import { signOutAdmin } from '../services/auth-service.js';
import { getDataModeLabel } from '../services/supabase-client.js';
import { listOrders } from '../services/store.js';
import { escapeHtml, getStatusMeta } from '../utils/format.js';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', href: '../dashboard/' },
  { id: 'orders', label: 'Pedidos', href: '../orders/' },
  { id: 'products', label: 'Menú', href: '../products/' },
  { id: 'tables', label: 'Mesas', href: '../tables/' },
  { id: 'settings', label: 'Configuración', href: '../settings/' }
];

export function statusBadge(status, orderType) {
  const meta = getStatusMeta(status, orderType);
  return `<span class="status-badge status-badge--${escapeHtml(meta.tone)}">${escapeHtml(meta.label)}</span>`;
}

export async function renderAdminLayout({ active, title, description, session, content, actions = '' }) {
  const app = document.querySelector('#adminApp');
  if (!app) return;

  const orders = await listOrders().catch(() => []);
  const openOrders = orders.filter((order) => ['pending', 'preparing'].includes(order.status)).length;

  app.innerHTML = `
    <div class="admin-shell">
      <aside class="admin-sidebar">
        <div>
          <a class="admin-brand" href="../dashboard/">
            Brasa Marina
            <span>Sistema interno</span>
          </a>
          <nav class="admin-nav" aria-label="Navegación administrativa">
            ${navItems
              .map(
                (item) => `
                  <a class="admin-nav__link ${active === item.id ? 'is-active' : ''}" href="${item.href}">
                    ${item.label}
                    ${item.id === 'orders' && openOrders ? `<span class="admin-nav__count">${openOrders}</span>` : ''}
                  </a>
                `
              )
              .join('')}
            <a class="admin-nav__link admin-nav__link--external" href="../../index.html" target="_blank" rel="noopener">
              Ver sitio público
            </a>
          </nav>
        </div>

        <div class="admin-user">
          <div>
            <small>Administrador</small>
            <strong>${escapeHtml(session?.user?.email || session?.email || 'Sesión activa')}</strong>
          </div>
          <button class="admin-action admin-action--light" type="button" id="adminLogoutBtn">Cerrar sesión</button>
        </div>
      </aside>

      <main class="admin-main">
        <div class="admin-topbar">
          <div>
            <h1>${escapeHtml(title)}</h1>
            <p>${escapeHtml(description)}</p>
          </div>
          <div class="admin-topbar__actions">
            ${actions}
            <span class="admin-badge">${getDataModeLabel()}</span>
          </div>
        </div>
        ${content}
      </main>
    </div>
  `;

  document.querySelector('#adminLogoutBtn')?.addEventListener('click', () => signOutAdmin('../login/'));
}
