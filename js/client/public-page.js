import {
  PAYMENT_METHODS,
  PRODUCT_CATEGORIES,
  createOrder,
  getOrder,
  getSettings,
  listProducts,
  listTables,
  subscribe
} from '../services/store.js';
import {
  addToCart,
  clearCart,
  getCartSummary,
  getMyOrders,
  removeFromCart,
  saveMyOrder,
  subscribeCart,
  updateCartQuantity
} from '../services/cart-service.js';
import {
  escapeHtml,
  formatCurrency,
  formatDateTime,
  formatTime,
  getOrderFlow,
  getOrderLabel,
  getPaymentLabel,
  getStatusMeta,
  toWhatsappNumber
} from '../utils/format.js';

let selectedFilter = 'todos';
let activeOrderId = null;
let toastTimer = null;
let lastFocusedElement = null;

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

function getTableFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const value = Number(params.get('mesa'));
  return Number.isInteger(value) && value > 0 ? value : null;
}

function showToast(message) {
  const toast = $('#appToast');
  if (!toast) return;

  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.hidden = false;
  toast.classList.add('is-visible');

  toastTimer = setTimeout(() => {
    toast.classList.remove('is-visible');
    toast.hidden = true;
  }, 2800);
}

function categoryLabel(product) {
  return PRODUCT_CATEGORIES.find((category) => category.id === product.category)?.label || product.category;
}

/* ---------------------------------------------------------------- menú ---- */

function productCardTemplate(product) {
  const unavailable = !product.available;
  const safeName = escapeHtml(product.name);

  return `
    <article class="menu__item ${unavailable ? 'is-unavailable' : ''}" data-category="${product.filters.join(' ')}">
      <div class="menu__item-media">
        <img src="${escapeHtml(product.image)}" alt="${safeName}" class="menu__item-img" loading="lazy" decoding="async">
        ${unavailable ? '<span class="availability-pill">Agotado</span>' : ''}
        ${
          unavailable
            ? ''
            : `<button class="menu__quick-add" type="button" data-add-to-cart="${product.id}" aria-label="Agregar ${safeName} al pedido">Agregar</button>`
        }
      </div>
      <div class="menu__item-body">
        <div class="menu__item-top">
          <span class="menu__item-tag">${escapeHtml(product.tag || categoryLabel(product))}</span>
          <span class="menu__item-price">${formatCurrency(product.price)}</span>
        </div>
        <h3 class="menu__item-name">${safeName}</h3>
        <p class="menu__item-description">${escapeHtml(product.description)}</p>
        <button class="btn btn--order" type="button" data-add-to-cart="${product.id}" ${unavailable ? 'disabled' : ''}>
          ${unavailable ? 'Agotado' : 'Agregar al pedido'}
        </button>
      </div>
    </article>
  `;
}

function featuredCardTemplate(product) {
  return `
    <article class="dish-card">
      <div class="dish-card__media">
        <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" class="dish-card__img" loading="lazy" decoding="async">
      </div>
      <div class="dish-card__body">
        <h3 class="dish-card__name">${escapeHtml(product.name)}</h3>
        <p class="dish-card__description">${escapeHtml(product.description)}</p>
        <span class="dish-card__price">${formatCurrency(product.price)} COP</span>
        <button class="btn btn--primary btn--small" type="button" data-add-to-cart="${product.id}">Agregar</button>
      </div>
    </article>
  `;
}

function renderMenu() {
  const menuList = $('#menuList');
  const emptyMessage = $('#menuEmpty');
  if (!menuList) return;

  const products = listProducts({ includeUnavailable: true });
  const filteredProducts =
    selectedFilter === 'todos'
      ? products
      : products.filter((product) => product.filters.includes(selectedFilter));

  menuList.innerHTML = filteredProducts.map(productCardTemplate).join('');

  if (emptyMessage) {
    emptyMessage.hidden = filteredProducts.length > 0;
  }
}

function renderFeatured() {
  const grid = $('.featured__grid');
  if (!grid) return;

  const featuredProducts = listProducts()
    .filter((product) => product.featured)
    .slice(0, 4);

  if (featuredProducts.length) {
    grid.innerHTML = featuredProducts.map(featuredCardTemplate).join('');
  }
}

function setFilter(button) {
  selectedFilter = button.dataset.filter || 'todos';

  $$('.menu__filter-btn').forEach((item) => {
    const isActive = item === button;
    item.classList.toggle('is-active', isActive);
    item.setAttribute('aria-selected', String(isActive));
  });

  renderMenu();
}

/* --------------------------------------------------------------- carrito ---- */

function renderCart() {
  const summary = getCartSummary();
  const cartItems = $('#cartItems');
  const hasUnavailable = summary.items.some((item) => !item.available);

  $$('[data-cart-count]').forEach((node) => {
    node.textContent = String(summary.count);
    node.classList.toggle('is-filled', summary.count > 0);
  });

  $$('[data-cart-total]').forEach((node) => {
    node.textContent = formatCurrency(summary.total);
  });

  const checkoutButton = $('#cartCheckoutBtn');
  if (checkoutButton) checkoutButton.disabled = summary.items.length === 0 || hasUnavailable;

  const mobileBar = $('#cartBar');
  if (mobileBar) mobileBar.hidden = summary.count === 0;

  if (!cartItems) return;

  if (!summary.items.length) {
    cartItems.innerHTML = `
      <div class="cart-empty">
        <strong>Tu pedido está vacío</strong>
        <p>Agrega platos desde el menú para continuar.</p>
      </div>
    `;
    return;
  }

  cartItems.innerHTML = `
    ${hasUnavailable ? '<p class="form-message">Hay productos agotados en tu pedido. Elimínalos para continuar.</p>' : ''}
    ${summary.items
      .map(
        (item) => `
          <article class="cart-item ${item.available ? '' : 'is-unavailable'}">
            <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" class="cart-item__img" loading="lazy">
            <div class="cart-item__body">
              <div class="cart-item__top">
                <h3>${escapeHtml(item.name)}</h3>
                <button class="cart-item__remove" type="button" data-cart-remove="${item.productId}">Eliminar</button>
              </div>
              <div class="cart-item__meta">
                <span>${item.available ? formatCurrency(item.unitPrice) : 'Agotado'}</span>
                <strong>${formatCurrency(item.subtotal)}</strong>
              </div>
              <div class="quantity-control" aria-label="Cantidad de ${escapeHtml(item.name)}">
                <button type="button" data-cart-decrease="${item.productId}" aria-label="Quitar una unidad">−</button>
                <span>${item.quantity}</span>
                <button type="button" data-cart-increase="${item.productId}" aria-label="Agregar una unidad">+</button>
              </div>
            </div>
          </article>
        `
      )
      .join('')}
  `;
}

function addProductToOrder(productId) {
  if (!productId) return;

  const result = addToCart(productId);
  showToast(result.message);
  renderCart();
}

/* ------------------------------------------------------ overlays / foco ---- */

function trapFocus(container, event) {
  const focusable = $$(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    container
  ).filter((node) => node.offsetParent !== null);

  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function openOverlay(element, { drawer = false } = {}) {
  if (!element) return;

  lastFocusedElement = document.activeElement;

  if (drawer) {
    $('#cartBackdrop').hidden = false;
    element.classList.add('is-open');
  } else {
    element.hidden = false;
    element.classList.add('is-open');
  }

  element.setAttribute('aria-hidden', 'false');
  document.body.classList.add(drawer ? 'drawer-open' : 'modal-open');

  const focusTarget = $('[data-autofocus]', element) || $('button, input, select', element);
  focusTarget?.focus({ preventScroll: true });
}

function closeOverlay(element, { drawer = false } = {}) {
  if (!element || !element.classList.contains('is-open')) return;

  element.classList.remove('is-open');
  element.setAttribute('aria-hidden', 'true');

  if (drawer) {
    $('#cartBackdrop').hidden = true;
  } else {
    element.hidden = true;
  }

  document.body.classList.remove(drawer ? 'drawer-open' : 'modal-open');
  lastFocusedElement?.focus?.({ preventScroll: true });
}

const openCart = () => {
  renderCart();
  openOverlay($('#cartDrawer'), { drawer: true });
};
const closeCart = () => closeOverlay($('#cartDrawer'), { drawer: true });

/* -------------------------------------------------------------- checkout ---- */

function setGroupEnabled(group, enabled) {
  if (!group) return;
  group.hidden = !enabled;
  $$('input, select, textarea', group).forEach((field) => {
    field.disabled = !enabled;
  });
}

function getSelectedOrderType(form) {
  return new FormData(form).get('orderType') || 'table';
}

function populateTableSelect() {
  const select = $('#tableNumberSelect');
  if (!select) return;

  const detectedTable = getTableFromUrl();
  const previous = select.value;

  select.innerHTML = listTables()
    .map((table) => {
      const isDetected = detectedTable === table.number;
      const statusLabel = isDetected ? 'Tu mesa' : table.status === 'free' ? 'Libre' : 'Ocupada';
      return `<option value="${table.number}">Mesa ${String(table.number).padStart(2, '0')} · ${statusLabel}</option>`;
    })
    .join('');

  const preferred = previous || (detectedTable ? String(detectedTable) : '');
  if (preferred) select.value = preferred;
}

function populateDeliverySelects() {
  const settings = getSettings();
  const zoneSelect = $('#deliveryZoneSelect');
  const paymentSelect = $('#paymentMethodSelect');

  if (zoneSelect) {
    const previous = zoneSelect.value;
    zoneSelect.innerHTML = [
      '<option value="">Selecciona tu zona</option>',
      ...(settings.deliveryZones || []).map(
        (zone) =>
          `<option value="${zone.id}">${escapeHtml(zone.name)} · ${formatCurrency(zone.fee)} · ${zone.etaMinutes} min</option>`
      )
    ].join('');
    if (previous) zoneSelect.value = previous;
  }

  if (paymentSelect && !paymentSelect.options.length) {
    paymentSelect.innerHTML = PAYMENT_METHODS.map(
      (method) => `<option value="${method.id}">${escapeHtml(method.label)}</option>`
    ).join('');
  }
}

function getSelectedZone() {
  const zoneId = $('#deliveryZoneSelect')?.value;
  return (getSettings().deliveryZones || []).find((zone) => zone.id === zoneId) || null;
}

function updateCheckoutFields() {
  const form = $('#checkoutForm');
  if (!form) return;

  const type = getSelectedOrderType(form);
  const settings = getSettings();

  setGroupEnabled($('#tableField'), type === 'table');
  setGroupEnabled($('#phoneField'), type !== 'table');
  setGroupEnabled($('#deliveryFields'), type === 'delivery');

  const nameInput = $('[name="customerName"]', form);
  const phoneInput = $('[name="customerPhone"]', form);
  if (nameInput) nameInput.required = type !== 'table';
  if (phoneInput) phoneInput.required = type !== 'table';

  if (type === 'delivery') {
    const method = PAYMENT_METHODS.find((entry) => entry.id === $('#paymentMethodSelect')?.value);
    setGroupEnabled($('#changeField'), Boolean(method?.needsChange));
  }

  $$('.choice-card').forEach((card) => {
    card.classList.toggle('is-selected', $('input', card)?.value === type);
  });

  const deliveryNote = $('#deliveryMinNote');
  if (deliveryNote) {
    deliveryNote.textContent = `Pedido mínimo para domicilio: ${formatCurrency(settings.deliveryMinOrder)}.`;
  }

  renderCheckoutSummary();
}

function renderCheckoutSummary() {
  const summary = getCartSummary();
  const target = $('#checkoutSummary');
  const form = $('#checkoutForm');
  if (!target || !form) return;

  const isDelivery = getSelectedOrderType(form) === 'delivery';
  const zone = isDelivery ? getSelectedZone() : null;
  const deliveryFee = zone?.fee || 0;

  target.innerHTML = `
    <h3>Resumen del pedido</h3>
    ${summary.items
      .map(
        (item) => `
          <div class="order-summary__row">
            <span>${escapeHtml(item.name)} × ${item.quantity}</span>
            <strong>${formatCurrency(item.subtotal)}</strong>
          </div>
        `
      )
      .join('')}
    <div class="order-summary__row">
      <span>Subtotal</span>
      <strong>${formatCurrency(summary.total)}</strong>
    </div>
    ${
      isDelivery
        ? `<div class="order-summary__row">
             <span>Domicilio${zone ? ` · ${escapeHtml(zone.name)}` : ''}</span>
             <strong>${zone ? formatCurrency(deliveryFee) : 'Elige tu zona'}</strong>
           </div>`
        : ''
    }
    <div class="order-summary__total">
      <span>Total</span>
      <strong>${formatCurrency(summary.total + deliveryFee)}</strong>
    </div>
    ${
      isDelivery && zone
        ? `<p class="order-summary__hint">Entrega estimada: ${zone.etaMinutes} minutos después de confirmar.</p>`
        : ''
    }
  `;
}

function openCheckout() {
  const summary = getCartSummary();
  const message = $('#checkoutMessage');

  if (!summary.items.length) {
    showToast('Agrega al menos un producto para continuar.');
    return;
  }

  if (summary.items.some((item) => !item.available)) {
    showToast('Quita los productos agotados antes de confirmar.');
    return;
  }

  populateTableSelect();
  populateDeliverySelects();
  updateCheckoutFields();
  if (message) message.hidden = true;
  closeCart();
  openOverlay($('#checkoutModal'));
}

function showCheckoutMessage(message) {
  const target = $('#checkoutMessage');
  if (!target) return;
  target.textContent = message;
  target.hidden = false;
  target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function handleCheckoutSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const formData = new FormData(form);
  const summary = getCartSummary();

  try {
    const order = createOrder({
      customerName: formData.get('customerName'),
      customerPhone: formData.get('customerPhone'),
      changeFor: formData.get('changeFor'),
      deliveryAddress: formData.get('deliveryAddress'),
      deliveryReference: formData.get('deliveryReference'),
      deliveryZoneId: formData.get('deliveryZoneId'),
      items: summary.items,
      notes: formData.get('notes'),
      orderType: formData.get('orderType'),
      paymentMethod: formData.get('paymentMethod'),
      tableNumber: formData.get('tableNumber')
    });

    clearCart();
    saveMyOrder(order);
    form.reset();
    closeOverlay($('#checkoutModal'));
    showOrderStatus(order.id);
    showToast(`Pedido #${order.number} confirmado.`);
  } catch (error) {
    showCheckoutMessage(error.message);
  }
}

/* ------------------------------------------------------------ seguimiento ---- */

function statusStepTemplate(status, order) {
  const flow = getOrderFlow(order.orderType);
  const statusIndex = flow.indexOf(status);
  const orderIndex = flow.indexOf(order.status);
  const meta = getStatusMeta(status, order.orderType);
  const reachedAt = order.statusHistory?.find((entry) => entry.status === status)?.at;

  return `
    <li class="status-step ${status === order.status ? 'is-current' : ''} ${statusIndex < orderIndex ? 'is-done' : ''}">
      <span class="status-step__marker"></span>
      <span>
        ${meta.label}
        ${reachedAt ? `<small>${formatTime(reachedAt)}</small>` : ''}
      </span>
    </li>
  `;
}

function deliveryPanelTemplate(order) {
  if (order.orderType !== 'delivery' || !order.delivery) return '';

  const eta = new Date(new Date(order.createdAt).getTime() + (order.delivery.etaMinutes || 45) * 60000);
  const isClosed = ['completed', 'cancelled'].includes(order.status);

  return `
    <div class="delivery-panel">
      <div class="delivery-panel__row">
        <span>Entregar en</span>
        <strong>${escapeHtml(order.delivery.address)}</strong>
      </div>
      <div class="delivery-panel__row">
        <span>Zona</span>
        <strong>${escapeHtml(order.delivery.zoneName)}</strong>
      </div>
      ${
        order.delivery.reference
          ? `<div class="delivery-panel__row"><span>Referencia</span><strong>${escapeHtml(order.delivery.reference)}</strong></div>`
          : ''
      }
      <div class="delivery-panel__row">
        <span>Contacto</span>
        <strong>${escapeHtml(order.customerPhone)}</strong>
      </div>
      <div class="delivery-panel__row">
        <span>Pago</span>
        <strong>${escapeHtml(getPaymentLabel(order.payment?.method))}${
          order.payment?.changeFor ? ` · Cambio para ${formatCurrency(order.payment.changeFor)}` : ''
        }</strong>
      </div>
      ${
        isClosed
          ? ''
          : `<div class="delivery-panel__eta">Llegada estimada · <strong>${formatTime(eta)}</strong></div>`
      }
    </div>
  `;
}

function myOrdersTabsTemplate() {
  const orders = getMyOrders();
  if (orders.length < 2) return '';

  return `
    <div class="order-tabs" role="tablist" aria-label="Mis pedidos recientes">
      ${orders
        .map(
          (entry) => `
            <button
              class="order-tabs__btn ${entry.id === activeOrderId ? 'is-active' : ''}"
              type="button"
              role="tab"
              aria-selected="${entry.id === activeOrderId}"
              data-track-order="${entry.id}">
              #${entry.number}
            </button>
          `
        )
        .join('')}
    </div>
  `;
}

function renderOrderStatus(orderId) {
  const order = getOrder(orderId);
  const target = $('#orderStatusContent');
  if (!target) return;

  if (!order) {
    target.innerHTML = `
      ${myOrdersTabsTemplate()}
      <p class="cart-empty">No encontramos ese pedido en este navegador.</p>
    `;
    return;
  }

  const statusMeta = getStatusMeta(order.status, order.orderType);

  target.innerHTML = `
    ${myOrdersTabsTemplate()}
    <div class="status-card">
      <div class="status-card__head">
        <div>
          <span class="status-card__label">Pedido #${order.number}</span>
          <h3>${statusMeta.label}</h3>
          <p>${getOrderLabel(order)} · ${formatDateTime(order.createdAt)}</p>
        </div>
        <strong>${formatCurrency(order.total)}</strong>
      </div>

      ${
        order.status === 'cancelled'
          ? '<p class="status-cancelled">Este pedido fue cancelado por el restaurante.</p>'
          : `<ol class="status-timeline">${getOrderFlow(order.orderType)
              .map((status) => statusStepTemplate(status, order))
              .join('')}</ol>`
      }

      ${deliveryPanelTemplate(order)}

      <div class="order-summary order-summary--compact">
        ${order.items
          .map(
            (item) => `
              <div class="order-summary__row">
                <span>${escapeHtml(item.name)} × ${item.quantity}</span>
                <strong>${formatCurrency(item.subtotal)}</strong>
              </div>
            `
          )
          .join('')}
        ${
          order.deliveryFee
            ? `<div class="order-summary__row"><span>Domicilio</span><strong>${formatCurrency(order.deliveryFee)}</strong></div>`
            : ''
        }
        <div class="order-summary__total">
          <span>Total</span>
          <strong>${formatCurrency(order.total)}</strong>
        </div>
      </div>

      ${order.notes ? `<p class="status-card__notes">Nota: ${escapeHtml(order.notes)}</p>` : ''}
    </div>
  `;
}

function showOrderStatus(orderId) {
  activeOrderId = orderId;
  renderOrderStatus(orderId);
  openOverlay($('#orderStatusModal'));
}

function showLastOrder() {
  const [lastOrder] = getMyOrders();
  if (!lastOrder) {
    showToast('Todavía no tienes un pedido en este navegador.');
    return;
  }
  showOrderStatus(lastOrder.id);
}

/* ------------------------------------------------- configuración pública ---- */

function applySettingsToPage() {
  const settings = getSettings();
  const whatsappNumber = toWhatsappNumber(settings.whatsapp);
  const whatsappText = encodeURIComponent(`Hola, quiero hacer una reserva en ${settings.restaurantName}.`);

  $$('[data-settings]').forEach((node) => {
    const value = settings[node.dataset.settings];
    if (value) node.textContent = value;
  });

  $$('[data-whatsapp-link]').forEach((node) => {
    node.href = `https://wa.me/${whatsappNumber}?text=${whatsappText}`;
  });

  $$('[data-phone-link]').forEach((node) => {
    node.href = `tel:${settings.phone.replace(/\s/g, '')}`;
  });

  const deliveryBanner = $('#deliveryBanner');
  if (deliveryBanner) {
    deliveryBanner.hidden = !settings.deliveryEnabled;
  }

  const deliveryChoice = $('#deliveryChoice');
  if (deliveryChoice) {
    deliveryChoice.hidden = !settings.deliveryEnabled;
    $('input', deliveryChoice).disabled = !settings.deliveryEnabled;
  }

  const zonesGrid = $('#deliveryZonesGrid');
  if (zonesGrid) {
    zonesGrid.innerHTML = settings.deliveryEnabled
      ? (settings.deliveryZones || [])
          .map(
            (zone) => `
              <article class="delivery-zone">
                <h3>${escapeHtml(zone.name)}</h3>
                <p class="delivery-zone__fee">${formatCurrency(zone.fee)}</p>
                <p class="delivery-zone__eta">Entrega en ~${zone.etaMinutes} min</p>
              </article>
            `
          )
          .join('')
      : '<p class="cart-empty">Los domicilios están pausados temporalmente. Puedes pedir para llevar.</p>';
  }

  const minOrderNote = $('#deliveryMinOrderNote');
  if (minOrderNote) {
    minOrderNote.textContent = `Pedido mínimo ${formatCurrency(settings.deliveryMinOrder)} · Cobertura en Cartagena`;
  }
}

/* ---------------------------------------------------------------- eventos ---- */

function bindPublicEvents() {
  $$('.menu__filter-btn').forEach((button) => {
    button.addEventListener('click', () => setFilter(button));
  });

  $$('[data-open-cart]').forEach((button) => button.addEventListener('click', openCart));
  $('#cartCloseBtn')?.addEventListener('click', closeCart);
  $('#cartBackdrop')?.addEventListener('click', closeCart);
  $('#cartCheckoutBtn')?.addEventListener('click', openCheckout);
  $$('[data-my-order]').forEach((button) => button.addEventListener('click', showLastOrder));

  $('#checkoutCloseBtn')?.addEventListener('click', () => closeOverlay($('#checkoutModal')));
  $('#checkoutBackBtn')?.addEventListener('click', () => {
    closeOverlay($('#checkoutModal'));
    openCart();
  });
  $('#checkoutForm')?.addEventListener('change', updateCheckoutFields);
  $('#checkoutForm')?.addEventListener('submit', handleCheckoutSubmit);

  $('#orderStatusCloseBtn')?.addEventListener('click', () => closeOverlay($('#orderStatusModal')));
  $('#orderStatusCartBtn')?.addEventListener('click', () => {
    closeOverlay($('#orderStatusModal'));
    $('#menu')?.scrollIntoView({ behavior: 'smooth' });
  });

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const addButton = target.closest('[data-add-to-cart]');
    if (addButton) addProductToOrder(addButton.dataset.addToCart);

    const increaseButton = target.closest('[data-cart-increase]');
    if (increaseButton) {
      const item = getCartSummary().items.find((entry) => entry.productId === increaseButton.dataset.cartIncrease);
      if (item) updateCartQuantity(item.productId, item.quantity + 1);
    }

    const decreaseButton = target.closest('[data-cart-decrease]');
    if (decreaseButton) {
      const item = getCartSummary().items.find((entry) => entry.productId === decreaseButton.dataset.cartDecrease);
      if (item) updateCartQuantity(item.productId, item.quantity - 1);
    }

    const removeButton = target.closest('[data-cart-remove]');
    if (removeButton) removeFromCart(removeButton.dataset.cartRemove);

    const trackButton = target.closest('[data-track-order]');
    if (trackButton) {
      activeOrderId = trackButton.dataset.trackOrder;
      renderOrderStatus(activeOrderId);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeCart();
      closeOverlay($('#checkoutModal'));
      closeOverlay($('#orderStatusModal'));
      return;
    }

    if (event.key !== 'Tab') return;
    const openOverlayElement = $('.modal.is-open') || $('.cart-drawer.is-open');
    if (openOverlayElement) trapFocus(openOverlayElement, event);
  });
}

function applyQrContext() {
  const tableNumber = getTableFromUrl();
  if (!tableNumber) return;

  const banner = $('#qrBanner');
  if (banner) {
    banner.hidden = false;
    $('[data-qr-table]', banner).textContent = String(tableNumber).padStart(2, '0');
  }

  showToast(`Mesa ${tableNumber} detectada desde QR.`);
}

export function initPublicOrdering() {
  if (!$('#menuList')) return;

  document.documentElement.dataset.brasaAppReady = 'true';
  applySettingsToPage();
  renderFeatured();
  renderMenu();
  renderCart();
  bindPublicEvents();
  applyQrContext();

  subscribe(() => {
    renderMenu();
    renderFeatured();
    renderCart();
    applySettingsToPage();

    if (!$('#checkoutModal')?.classList.contains('is-open')) {
      populateTableSelect();
    }

    if (activeOrderId) renderOrderStatus(activeOrderId);
  });

  subscribeCart(() => {
    renderCart();
    if ($('#checkoutModal')?.classList.contains('is-open')) renderCheckoutSummary();
  });
}
