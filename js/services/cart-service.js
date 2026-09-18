import { listProducts } from './store.js';

const CART_KEY = 'brasa_marina_cart_v1';
const MY_ORDERS_KEY = 'brasa_marina_my_orders_v1';
const MY_ORDERS_LIMIT = 6;
const listeners = new Set();

let productsCache = null;

async function ensureProductsCache() {
  if (!productsCache) {
    productsCache = await listProducts({ includeUnavailable: true });
  }
  return productsCache;
}

export function invalidateProductsCache() {
  productsCache = null;
}

function readCart() {
  const raw = localStorage.getItem(CART_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw);
  } catch (error) {
    localStorage.removeItem(CART_KEY);
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  notify();
}

function notify() {
  listeners.forEach((listener) => listener());
}

export function subscribeCart(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCart() {
  return readCart();
}

export async function addToCart(productId, quantity = 1) {
  invalidateProductsCache();
  const products = await ensureProductsCache();
  const product = products.find((item) => item.id === productId);

  if (!product || !product.available) {
    return { ok: false, message: 'Producto agotado' };
  }

  const cart = readCart();
  const item = cart.find((entry) => entry.productId === productId);

  if (item) {
    item.quantity += quantity;
  } else {
    cart.push({ productId, quantity });
  }

  saveCart(cart);
  return { ok: true, message: `${product.name} agregado al pedido` };
}

export function updateCartQuantity(productId, quantity) {
  const nextQuantity = Math.max(0, Number(quantity || 0));
  const cart = readCart();
  const item = cart.find((entry) => entry.productId === productId);

  if (!item) return;
  item.quantity = nextQuantity;
  saveCart(cart.filter((entry) => entry.quantity > 0));
}

export function removeFromCart(productId) {
  saveCart(readCart().filter((entry) => entry.productId !== productId));
}

export function clearCart() {
  localStorage.removeItem(CART_KEY);
  notify();
}

export async function getCartSummary() {
  const products = await ensureProductsCache();

  const items = readCart()
    .map((entry) => {
      const product = products.find((item) => item.id === entry.productId);
      if (!product) return null;

      return {
        productId: product.id,
        name: product.name,
        image: product.image,
        quantity: entry.quantity,
        unitPrice: product.price,
        subtotal: product.price * entry.quantity,
        available: product.available
      };
    })
    .filter(Boolean);

  return {
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    items,
    total: items.reduce((sum, item) => sum + item.subtotal, 0)
  };
}

export function getMyOrders() {
  const raw = localStorage.getItem(MY_ORDERS_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    localStorage.removeItem(MY_ORDERS_KEY);
    return [];
  }
}

export function saveMyOrder(order) {
  const entry = {
    id: order.id,
    lookupToken: order.lookupToken,
    number: order.number,
    orderType: order.orderType,
    createdAt: order.createdAt
  };

  const next = [entry, ...getMyOrders().filter((item) => item.id !== order.id)].slice(0, MY_ORDERS_LIMIT);
  localStorage.setItem(MY_ORDERS_KEY, JSON.stringify(next));
}

export function getLastOrder() {
  return getMyOrders()[0] || null;
}
