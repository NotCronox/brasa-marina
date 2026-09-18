import {
  DEFAULT_SETTINGS,
  DELIVERY_ZONES,
  DEMO_PRODUCTS,
  ORDER_STATUSES,
  ORDER_TYPES,
  PAYMENT_METHODS,
  createDemoOrders,
  createDemoTables
} from '../data/demo-data.js';
import { createId, isValidPhone } from '../utils/format.js';

const STORE_KEY = 'brasa_marina_store_v2';
const ACTIVE_STATUSES = ['pending', 'preparing', 'ready', 'on_the_way'];
const listeners = new Set();
const channel = 'BroadcastChannel' in window ? new BroadcastChannel('brasa-marina-store') : null;

const clone = (value) => JSON.parse(JSON.stringify(value));

function reconcileActiveOrderTables(state) {
  const activeTableNumbers = new Set(
    state.orders
      .filter((order) => order.orderType === 'table' && ACTIVE_STATUSES.includes(order.status))
      .map((order) => order.tableNumber)
      .filter(Boolean)
  );

  state.tables.forEach((table) => {
    if (activeTableNumbers.has(table.number)) {
      table.status = 'occupied';
    }
  });

  return state;
}

function createInitialState() {
  const orders = createDemoOrders().map((order) => ({
    ...order,
    lookupToken: createId('token')
  }));

  return reconcileActiveOrderTables({
    meta: {
      dataMode: 'demo-local',
      nextOrderNumber: Math.max(...orders.map((order) => order.number)) + 1,
      seededAt: new Date().toISOString()
    },
    settings: clone(DEFAULT_SETTINGS),
    products: clone(DEMO_PRODUCTS),
    orders,
    tables: createDemoTables()
  });
}

function readState() {
  const raw = localStorage.getItem(STORE_KEY);
  if (!raw) {
    const initialState = createInitialState();
    localStorage.setItem(STORE_KEY, JSON.stringify(initialState));
    return initialState;
  }

  try {
    const state = JSON.parse(raw);
    state.settings = { ...clone(DEFAULT_SETTINGS), ...state.settings };
    if (!state.settings.deliveryZones?.length) {
      state.settings.deliveryZones = clone(DELIVERY_ZONES);
    }
    return reconcileActiveOrderTables(state);
  } catch (error) {
    const recoveredState = createInitialState();
    localStorage.setItem(STORE_KEY, JSON.stringify(recoveredState));
    return recoveredState;
  }
}

function saveState(state, options = {}) {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
  notify();

  if (!options.silentBroadcast && channel) {
    channel.postMessage({ type: 'store-updated' });
  }
}

function notify() {
  listeners.forEach((listener) => listener());
}

function withState(mutator) {
  const state = readState();
  const result = mutator(state);
  saveState(state);
  return result;
}

if (channel) {
  channel.addEventListener('message', (event) => {
    if (event.data?.type === 'store-updated') notify();
  });
}

window.addEventListener('storage', (event) => {
  if (event.key === STORE_KEY) notify();
});

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function resetDemoStore() {
  const initialState = createInitialState();
  saveState(initialState);
  return initialState;
}

export async function getSettings() {
  return readState().settings;
}

export async function getDeliveryZones() {
  return readState().settings.deliveryZones || [];
}

export async function getDeliveryZone(zoneId) {
  return (await getDeliveryZones()).find((zone) => zone.id === zoneId) || null;
}

export async function updateSettings(payload) {
  return withState((state) => {
    state.settings = {
      ...state.settings,
      ...payload,
      tableCount: Math.max(1, Number(payload.tableCount || state.settings.tableCount || 20)),
      deliveryEnabled: Boolean(payload.deliveryEnabled ?? state.settings.deliveryEnabled),
      deliveryMinOrder: Math.max(0, Number(payload.deliveryMinOrder ?? state.settings.deliveryMinOrder)),
      deliveryZones: payload.deliveryZones?.length ? payload.deliveryZones : state.settings.deliveryZones
    };

    const wantedCount = state.settings.tableCount;
    const currentCount = state.tables.length;

    if (wantedCount > currentCount) {
      for (let number = currentCount + 1; number <= wantedCount; number += 1) {
        state.tables.push({ id: `table-${number}`, number, status: 'free' });
      }
    }

    if (wantedCount < currentCount) {
      state.tables = state.tables.slice(0, wantedCount);
    }

    return state.settings;
  });
}

export async function listProducts(options = {}) {
  const products = readState().products;
  return options.includeUnavailable ? products : products.filter((product) => product.available);
}

export async function getProduct(productId) {
  return readState().products.find((product) => product.id === productId);
}

export async function saveProduct(payload) {
  return withState((state) => {
    const now = new Date().toISOString();
    const normalized = {
      name: payload.name.trim(),
      description: payload.description.trim(),
      price: Number(payload.price),
      image: payload.image.trim(),
      category: payload.category,
      filters: payload.filters?.length ? payload.filters : [payload.category],
      tag: payload.tag?.trim() || 'Carta',
      available: Boolean(payload.available),
      featured: Boolean(payload.featured)
    };

    if (payload.id) {
      const index = state.products.findIndex((product) => product.id === payload.id);
      if (index >= 0) {
        state.products[index] = {
          ...state.products[index],
          ...normalized,
          updatedAt: now
        };
        return state.products[index];
      }
    }

    const product = {
      ...normalized,
      createdAt: now,
      id: createId('prod')
    };
    state.products.unshift(product);
    return product;
  });
}

export async function toggleProductAvailability(productId) {
  return withState((state) => {
    const product = state.products.find((item) => item.id === productId);
    if (!product) return null;
    product.available = !product.available;
    product.updatedAt = new Date().toISOString();
    return product;
  });
}

export async function deleteProduct(productId) {
  return withState((state) => {
    const before = state.products.length;
    state.products = state.products.filter((product) => product.id !== productId);
    return before !== state.products.length;
  });
}

export async function listOrders() {
  return readState().orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getOrderById(orderId) {
  return readState().orders.find((order) => order.id === orderId);
}

export async function getPublicOrderStatus({ number, lookupToken }) {
  const order = readState().orders.find(
    (item) => String(item.number) === String(number) && item.lookupToken === lookupToken
  );
  return order || null;
}

function buildOrderItems(state, items) {
  if (!items?.length) {
    throw new Error('Tu pedido está vacío.');
  }

  return items.map((item) => {
    const product = state.products.find((entry) => entry.id === item.productId);

    if (!product || !product.available) {
      throw new Error(`"${item.name || 'Un producto'}" ya no está disponible. Actualiza tu pedido.`);
    }

    const quantity = Math.max(1, Number(item.quantity) || 1);

    return {
      productId: product.id,
      name: product.name,
      quantity,
      unitPrice: product.price,
      subtotal: product.price * quantity
    };
  });
}

function buildDeliveryDetails(state, payload, subtotal) {
  const settings = state.settings;

  if (!settings.deliveryEnabled) {
    throw new Error('Los domicilios están desactivados en este momento.');
  }

  const zone = (settings.deliveryZones || []).find((entry) => entry.id === payload.deliveryZoneId);
  if (!zone) {
    throw new Error('Selecciona una zona de entrega válida.');
  }

  const address = payload.deliveryAddress?.trim();
  if (!address || address.length < 8) {
    throw new Error('Escribe una dirección de entrega completa.');
  }

  if (subtotal < settings.deliveryMinOrder) {
    throw new Error(`El pedido mínimo para domicilio es de $${settings.deliveryMinOrder.toLocaleString('es-CO')}.`);
  }

  return {
    delivery: {
      address,
      zoneId: zone.id,
      zoneName: zone.name,
      reference: payload.deliveryReference?.trim() || '',
      etaMinutes: zone.etaMinutes
    },
    deliveryFee: zone.fee
  };
}

function buildPaymentDetails(payload) {
  const method = PAYMENT_METHODS.find((entry) => entry.id === payload.paymentMethod) || PAYMENT_METHODS[0];
  const changeFor = Number(String(payload.changeFor || '').replace(/[^\d]/g, '')) || null;

  return {
    method: method.id,
    changeFor: method.needsChange ? changeFor : null
  };
}

export async function createOrder(payload) {
  return withState((state) => {
    if (!ORDER_TYPES[payload.orderType]) {
      throw new Error('Selecciona un tipo de pedido válido.');
    }

    const items = buildOrderItems(state, payload.items);
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const customerName = payload.customerName?.trim();
    const customerPhone = payload.customerPhone?.trim() || '';

    let tableNumber = null;
    let delivery = null;
    let deliveryFee = 0;
    let payment = null;

    if (payload.orderType === 'table') {
      tableNumber = Number(payload.tableNumber);
      if (!state.tables.some((table) => table.number === tableNumber)) {
        throw new Error('Selecciona una mesa válida.');
      }
    }

    if (payload.orderType !== 'table') {
      if (!customerName) throw new Error('Necesitamos tu nombre para este pedido.');
      if (!isValidPhone(customerPhone)) throw new Error('Escribe un teléfono de contacto válido.');
    }

    if (payload.orderType === 'delivery') {
      const details = buildDeliveryDetails(state, payload, subtotal);
      delivery = details.delivery;
      deliveryFee = details.deliveryFee;
      payment = buildPaymentDetails(payload);
    }

    const createdAt = new Date().toISOString();
    const number = state.meta.nextOrderNumber;
    state.meta.nextOrderNumber += 1;

    const order = {
      id: `order-${number}`,
      lookupToken: createId('token'),
      number,
      customerName: customerName || (payload.orderType === 'table' ? `Mesa ${tableNumber}` : 'Cliente'),
      customerPhone,
      tableNumber,
      orderType: payload.orderType,
      delivery,
      deliveryFee,
      payment,
      notes: payload.notes?.trim() || '',
      status: 'pending',
      statusHistory: [{ status: 'pending', at: createdAt }],
      createdAt,
      subtotal,
      total: subtotal + deliveryFee,
      items
    };

    state.orders.unshift(order);

    if (order.orderType === 'table') {
      const table = state.tables.find((item) => item.number === order.tableNumber);
      if (table) table.status = 'occupied';
    }

    return order;
  });
}

export async function updateOrderStatus(orderId, status) {
  return withState((state) => {
    const order = state.orders.find((item) => item.id === orderId);
    if (!order || !ORDER_STATUSES[status] || order.status === status) return null;

    order.status = status;
    order.updatedAt = new Date().toISOString();
    order.statusHistory = [...(order.statusHistory || []), { status, at: order.updatedAt }];

    if (order.tableNumber) {
      const table = state.tables.find((item) => item.number === order.tableNumber);
      if (table) {
        table.status = ACTIVE_STATUSES.includes(status) ? 'occupied' : 'free';
      }
    }

    return order;
  });
}

export async function listTables() {
  return readState().tables.sort((a, b) => a.number - b.number);
}

export async function updateTableStatus(tableNumber, status) {
  return withState((state) => {
    const table = state.tables.find((item) => item.number === Number(tableNumber));
    if (!table) return null;
    table.status = status;
    table.updatedAt = new Date().toISOString();
    return table;
  });
}

export async function getTopProducts(limit = 5) {
  const totals = new Map();
  (await listOrders())
    .filter((order) => order.status !== 'cancelled')
    .forEach((order) => {
      order.items.forEach((item) => {
        const current = totals.get(item.productId) || {
          name: item.name,
          quantity: 0,
          total: 0
        };
        current.quantity += item.quantity;
        current.total += item.subtotal;
        totals.set(item.productId, current);
      });
    });

  return [...totals.values()]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit);
}
