import { requireAdmin } from '../services/auth-service.js';
import { listOrders, subscribe, updateOrderStatus } from '../services/store.js';
import {
  escapeHtml,
  formatCurrency,
  formatDateTime,
  formatRelativeTime,
  getOrderFlow,
  getOrderLabel,
  getOrderTypeMeta,
  getPaymentLabel,
  getStatusMeta,
  normalizeText,
  toWhatsappNumber
} from '../utils/format.js';
import { renderAdminLayout, statusBadge } from './layout.js';

const session = await requireAdmin('../login/');

let activeStatus = 'all';
let activeType = 'all';
let searchTerm = '';
let keepSearchFocus = false;

const statusFilters = [
  { id: 'all', label: 'Todos' },
  { id: 'pending', label: 'Recibidos' },
  { id: 'preparing', label: 'En preparación' },
  { id: 'ready', label: 'Listos' },
  { id: 'on_the_way', label: 'En camino' },
  { id: 'completed', label: 'Entregados' },
  { id: 'cancelled', label: 'Cancelados' }
];

const typeFilters = [
  { id: 'all', label: 'Todos los canales' },
  { id: 'table', label: 'Mesa' },
  { id: 'takeaway', label: 'Para llevar' },
  { id: 'delivery', label: 'Domicilio' }
];

function getNextStatus(order) {
  const flow = getOrderFlow(order.orderType);
  const index = flow.indexOf(order.status);
  if (index < 0 || index >= flow.length - 1) return null;
  return flow[index + 1];
}

function matchesSearch(order) {
  if (!searchTerm) return true;

  const haystack = normalizeText(
    [order.number, order.customerName, order.customerPhone, order.delivery?.address, order.delivery?.zoneName]
      .filter(Boolean)
      .join(' ')
  );

  return haystack.includes(normalizeText(searchTerm));
}

function getVisibleOrders() {
  return listOrders().filter(
    (order) =>
      (activeStatus === 'all' || order.status === activeStatus) &&
      (activeType === 'all' || order.orderType === activeType) &&
      matchesSearch(order)
  );
}

function deliveryBlockTemplate(order) {
  if (order.orderType !== 'delivery' || !order.delivery) return '';

  const whatsapp = toWhatsappNumber(order.customerPhone);

  return `
    <div class="order-card__delivery">
      <p class="order-card__delivery-title">Entrega a domicilio · ${escapeHtml(order.delivery.zoneName)}</p>
      <p class="order-card__delivery-address">${escapeHtml(order.delivery.address)}</p>
      ${order.delivery.reference ? `<p class="order-card__meta">Referencia: ${escapeHtml(order.delivery.reference)}</p>` : ''}
      <p class="order-card__meta">
        Pago: ${escapeHtml(getPaymentLabel(order.payment?.method))}${
          order.payment?.changeFor ? ` · Cambio para ${formatCurrency(order.payment.changeFor)}` : ''
        }
      </p>
      <div class="order-card__contact">
        <a class="admin-action admin-action--light" href="tel:${escapeHtml(order.customerPhone)}">Llamar</a>
        ${
          whatsapp
            ? `<a class="admin-action admin-action--light" href="https://wa.me/${whatsapp}" target="_blank" rel="noopener">WhatsApp</a>`
            : ''
        }
      </div>
    </div>
  `;
}

function renderOrderCard(order) {
  const nextStatus = getNextStatus(order);
  const nextLabel = nextStatus ? getStatusMeta(nextStatus, order.orderType).label : '';
  const typeMeta = getOrderTypeMeta(order.orderType);

  return `
    <article class="order-card order-card--${escapeHtml(order.orderType)}">
      <div class="order-card__head">
        <div>
          <h2>#${order.number} <span class="order-card__type">${escapeHtml(typeMeta.short)}</span></h2>
          <p class="order-card__meta">${formatDateTime(order.createdAt)} · ${formatRelativeTime(order.createdAt)}</p>
        </div>
        ${statusBadge(order.status, order.orderType)}
      </div>

      <p class="order-card__meta">
        ${escapeHtml(getOrderLabel(order))} · ${escapeHtml(order.customerName || 'Sin nombre')}${
          order.customerPhone ? ` · ${escapeHtml(order.customerPhone)}` : ''
        }
      </p>

      ${deliveryBlockTemplate(order)}

      <ul class="order-card__items">
        ${order.items
          .map((item) => `<li>${escapeHtml(item.name)} × ${item.quantity} · ${formatCurrency(item.subtotal)}</li>`)
          .join('')}
      </ul>

      ${
        order.deliveryFee
          ? `<p class="order-card__meta">Subtotal ${formatCurrency(order.subtotal)} + domicilio ${formatCurrency(order.deliveryFee)}</p>`
          : ''
      }

      ${order.notes ? `<p class="order-card__notes">Nota: ${escapeHtml(order.notes)}</p>` : ''}

      <div class="order-card__footer">
        <strong>${formatCurrency(order.total)}</strong>
        <div class="order-card__actions">
          ${
            nextStatus
              ? `<button class="admin-action" type="button" data-next-status="${nextStatus}" data-order-id="${order.id}">Marcar ${escapeHtml(nextLabel)}</button>`
              : ''
          }
          ${
            ['cancelled', 'completed'].includes(order.status)
              ? ''
              : `<button class="admin-action admin-action--danger" type="button" data-cancel-order="${order.id}">Cancelar</button>`
          }
        </div>
      </div>
    </article>
  `;
}

function renderCounters(orders) {
  const activeStatuses = ['pending', 'preparing', 'ready', 'on_the_way'];
  const active = orders.filter((order) => activeStatuses.includes(order.status));
  const deliveryActive = active.filter((order) => order.orderType === 'delivery');

  return `
    <section class="admin-grid admin-grid--stats">
      <article class="stats-card">
        <span>Pedidos activos</span>
        <strong>${active.length}</strong>
      </article>
      <article class="stats-card">
        <span>Domicilios activos</span>
        <strong>${deliveryActive.length}</strong>
      </article>
      <article class="stats-card">
        <span>En camino</span>
        <strong>${orders.filter((order) => order.status === 'on_the_way').length}</strong>
      </article>
      <article class="stats-card">
        <span>Por confirmar</span>
        <strong>${orders.filter((order) => order.status === 'pending').length}</strong>
      </article>
    </section>
  `;
}

function bindEvents() {
  document.querySelectorAll('[data-status-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      activeStatus = button.dataset.statusFilter;
      render();
    });
  });

  document.querySelectorAll('[data-type-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      activeType = button.dataset.typeFilter;
      render();
    });
  });

  const searchInput = document.querySelector('#orderSearch');
  searchInput?.addEventListener('input', () => {
    searchTerm = searchInput.value;
    keepSearchFocus = true;
    render();
  });

  document.querySelectorAll('[data-next-status]').forEach((button) => {
    button.addEventListener('click', () => {
      updateOrderStatus(button.dataset.orderId, button.dataset.nextStatus);
    });
  });

  document.querySelectorAll('[data-cancel-order]').forEach((button) => {
    button.addEventListener('click', () => {
      const confirmed = window.confirm('¿Cancelar este pedido? La mesa quedará libre si estaba asociada.');
      if (confirmed) updateOrderStatus(button.dataset.cancelOrder, 'cancelled');
    });
  });

  if (keepSearchFocus && searchInput) {
    searchInput.focus();
    searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
    keepSearchFocus = false;
  }
}

function render() {
  if (!session) return;

  const allOrders = listOrders();
  const orders = getVisibleOrders();

  renderAdminLayout({
    active: 'orders',
    description: 'Mesa, para llevar y domicilio en un solo tablero. Avanza cada pedido hasta la entrega.',
    session,
    title: 'Pedidos',
    content: `
      ${renderCounters(allOrders)}

      <section class="admin-toolbar">
        <div class="admin-filters">
          ${statusFilters
            .map(
              (filter) => `
                <button class="admin-filter ${activeStatus === filter.id ? 'is-active' : ''}" type="button" data-status-filter="${filter.id}">
                  ${filter.label}
                </button>
              `
            )
            .join('')}
        </div>
        <label class="admin-search">
          <span class="sr-only">Buscar pedido</span>
          <input
            type="search"
            id="orderSearch"
            placeholder="Buscar por número, cliente, teléfono o dirección"
            value="${escapeHtml(searchTerm)}">
        </label>
      </section>

      <section class="admin-filters admin-filters--channels">
        ${typeFilters
          .map(
            (filter) => `
              <button class="admin-filter ${activeType === filter.id ? 'is-active' : ''}" type="button" data-type-filter="${filter.id}">
                ${filter.label}
              </button>
            `
          )
          .join('')}
      </section>

      <section class="orders-grid">
        ${
          orders.length
            ? orders.map(renderOrderCard).join('')
            : '<p class="cart-empty">No hay pedidos que coincidan con este filtro.</p>'
        }
      </section>
    `
  });

  bindEvents();
}

render();
subscribe(render);
