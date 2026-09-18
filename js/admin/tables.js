import { requireAdmin } from '../services/auth-service.js';
import { listOrders, listTables, subscribe, updateTableStatus } from '../services/store.js';
import { formatCurrency } from '../utils/format.js';
import { renderAdminLayout } from './layout.js';

const session = await requireAdmin('../login/');

function getActiveOrderForTable(tableNumber) {
  return listOrders().find(
    (order) =>
      order.tableNumber === tableNumber &&
      order.orderType === 'table' &&
      ['pending', 'preparing', 'ready'].includes(order.status)
  );
}

function renderTableCard(table) {
  const activeOrder = getActiveOrderForTable(table.number);

  return `
    <article class="table-card" data-status="${table.status}">
      <div class="table-card__head">
        <div>
          <span class="table-card__number">Mesa ${String(table.number).padStart(2, '0')}</span>
          <span class="status-badge status-badge--${table.status === 'free' ? 'success' : 'warning'}">
            ${table.status === 'free' ? 'Libre' : 'Ocupada'}
          </span>
        </div>
      </div>
      ${
        activeOrder
          ? `<p class="order-card__meta">Pedido #${activeOrder.number} · ${formatCurrency(activeOrder.total)}</p>`
          : '<p class="order-card__meta">Sin pedido activo.</p>'
      }
      <div class="table-card__actions">
        <button
          class="admin-action ${table.status === 'free' ? '' : 'admin-action--light'}"
          type="button"
          data-table-number="${table.number}"
          data-table-status="${table.status === 'free' ? 'occupied' : 'free'}">
          Marcar ${table.status === 'free' ? 'ocupada' : 'libre'}
        </button>
      </div>
    </article>
  `;
}

function bindEvents() {
  document.querySelectorAll('[data-table-number]').forEach((button) => {
    button.addEventListener('click', () => {
      updateTableStatus(button.dataset.tableNumber, button.dataset.tableStatus);
    });
  });
}

function render() {
  if (!session) return;

  const tables = listTables();

  renderAdminLayout({
    active: 'tables',
    description: 'Control visual de mesas y ocupación de salón.',
    session,
    title: 'Mesas',
    content: `
      <section class="admin-grid admin-grid--stats">
        <article class="stats-card">
          <span>Total mesas</span>
          <strong>${tables.length}</strong>
        </article>
        <article class="stats-card">
          <span>Libres</span>
          <strong>${tables.filter((table) => table.status === 'free').length}</strong>
        </article>
        <article class="stats-card">
          <span>Ocupadas</span>
          <strong>${tables.filter((table) => table.status === 'occupied').length}</strong>
        </article>
        <article class="stats-card">
          <span>Pedidos en sala</span>
          <strong>${listOrders().filter((order) => order.orderType === 'table' && ['pending', 'preparing', 'ready'].includes(order.status)).length}</strong>
        </article>
      </section>

      <section class="tables-grid">
        ${tables.map(renderTableCard).join('')}
      </section>
    `
  });

  bindEvents();
}

render();
subscribe(render);
