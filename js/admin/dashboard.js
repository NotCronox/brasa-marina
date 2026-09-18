import { requireAdmin } from '../services/auth-service.js';
import { getTopProducts, listOrders, subscribe } from '../services/store.js';
import {
  escapeHtml,
  formatCurrency,
  formatRelativeTime,
  getOrderLabel,
  getOrderTypeMeta,
  isToday
} from '../utils/format.js';
import { renderAdminLayout, statusBadge } from './layout.js';

const session = await requireAdmin('../login/');
const ACTIVE_STATUSES = ['pending', 'preparing', 'ready', 'on_the_way'];

function getStats(orders) {
  const todayOrders = orders.filter((order) => isToday(order.createdAt) && order.status !== 'cancelled');
  const salesToday = todayOrders.reduce((sum, order) => sum + order.total, 0);
  const deliveryToday = todayOrders.filter((order) => order.orderType === 'delivery');

  return {
    ordersToday: todayOrders.length,
    salesToday,
    averageTicket: todayOrders.length ? Math.round(salesToday / todayOrders.length) : 0,
    activeOrders: orders.filter((order) => ACTIVE_STATUSES.includes(order.status)).length,
    deliveryToday: deliveryToday.length,
    deliveryRevenue: deliveryToday.reduce((sum, order) => sum + order.deliveryFee, 0),
    onTheWay: orders.filter((order) => order.status === 'on_the_way').length,
    productsSold: todayOrders.reduce(
      (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0
    )
  };
}

function renderChannelBreakdown(orders) {
  const todayOrders = orders.filter((order) => isToday(order.createdAt) && order.status !== 'cancelled');
  const total = todayOrders.reduce((sum, order) => sum + order.total, 0) || 1;

  return ['table', 'takeaway', 'delivery']
    .map((type) => {
      const typeOrders = todayOrders.filter((order) => order.orderType === type);
      const revenue = typeOrders.reduce((sum, order) => sum + order.total, 0);
      const share = Math.round((revenue / total) * 100);

      return `
        <article class="channel-row">
          <div class="channel-row__head">
            <strong>${escapeHtml(getOrderTypeMeta(type).label)}</strong>
            <span>${typeOrders.length} pedidos · ${formatCurrency(revenue)}</span>
          </div>
          <div class="channel-row__bar" role="img" aria-label="${share}% de las ventas de hoy">
            <span style="width: ${share}%"></span>
          </div>
        </article>
      `;
    })
    .join('');
}

function renderRecentOrders(orders) {
  if (!orders.length) return '<p class="cart-empty">Aún no hay pedidos registrados.</p>';

  return orders
    .slice(0, 6)
    .map(
      (order) => `
        <article class="admin-list-item">
          <div>
            <strong>#${order.number} · ${escapeHtml(getOrderLabel(order))}</strong>
            <p>${formatCurrency(order.total)} · ${formatRelativeTime(order.createdAt)}</p>
          </div>
          ${statusBadge(order.status, order.orderType)}
        </article>
      `
    )
    .join('');
}

function renderTopProducts() {
  const products = getTopProducts(5);
  if (!products.length) return '<p class="cart-empty">Aún no hay ventas registradas.</p>';

  return products
    .map(
      (product) => `
        <article class="admin-list-item">
          <div>
            <strong>${escapeHtml(product.name)}</strong>
            <p>${product.quantity} unidades vendidas</p>
          </div>
          <strong>${formatCurrency(product.total)}</strong>
        </article>
      `
    )
    .join('');
}

function renderAlerts(orders) {
  const pendingDelivery = orders.filter((order) => order.orderType === 'delivery' && order.status === 'pending');
  const pendingOther = orders.filter((order) => order.orderType !== 'delivery' && order.status === 'pending');

  if (!pendingDelivery.length && !pendingOther.length) return '';

  const latest = pendingDelivery[0] || pendingOther[0];

  return `
    <div class="notification-card">
      <strong>${pendingDelivery.length ? 'Domicilio sin confirmar' : 'Nuevo pedido pendiente'}</strong>
      <span>#${latest.number} · ${escapeHtml(getOrderLabel(latest))} · ${formatCurrency(latest.total)} · ${formatRelativeTime(
        latest.createdAt
      )}</span>
      <a class="admin-action" href="../orders/">Ver pedidos (${pendingDelivery.length + pendingOther.length})</a>
    </div>
  `;
}

function render() {
  if (!session) return;

  const orders = listOrders();
  const stats = getStats(orders);

  renderAdminLayout({
    active: 'dashboard',
    description: 'Resumen operativo del restaurante: sala, para llevar y domicilios.',
    session,
    title: 'Dashboard',
    content: `
      ${renderAlerts(orders)}

      <section class="admin-grid admin-grid--stats">
        <article class="stats-card">
          <span>Pedidos hoy</span>
          <strong>${stats.ordersToday}</strong>
        </article>
        <article class="stats-card">
          <span>Ventas hoy</span>
          <strong>${formatCurrency(stats.salesToday)}</strong>
        </article>
        <article class="stats-card">
          <span>Ticket promedio</span>
          <strong>${formatCurrency(stats.averageTicket)}</strong>
        </article>
        <article class="stats-card">
          <span>Pedidos activos</span>
          <strong>${stats.activeOrders}</strong>
        </article>
      </section>

      <section class="admin-grid admin-grid--stats">
        <article class="stats-card">
          <span>Domicilios hoy</span>
          <strong>${stats.deliveryToday}</strong>
        </article>
        <article class="stats-card">
          <span>En camino ahora</span>
          <strong>${stats.onTheWay}</strong>
        </article>
        <article class="stats-card">
          <span>Ingresos por envío</span>
          <strong>${formatCurrency(stats.deliveryRevenue)}</strong>
        </article>
        <article class="stats-card">
          <span>Productos vendidos</span>
          <strong>${stats.productsSold}</strong>
        </article>
      </section>

      <section class="admin-grid admin-grid--two">
        <article class="admin-card">
          <h2>Pedidos recientes</h2>
          <div class="admin-list">${renderRecentOrders(orders)}</div>
        </article>
        <article class="admin-card">
          <h2>Ventas por canal (hoy)</h2>
          <div class="channel-list">${renderChannelBreakdown(orders)}</div>
          <h2 class="admin-card__subtitle">Productos más vendidos</h2>
          <div class="admin-list">${renderTopProducts()}</div>
        </article>
      </section>
    `
  });
}

render();
subscribe(render);
