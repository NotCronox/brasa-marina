import { ORDER_STATUSES, ORDER_TYPES, PAYMENT_METHODS, PRODUCT_CATEGORIES } from '../data/demo-data.js';
import { isSupabaseConfigured } from './supabase-config.js';
import * as local from './data-local.js';
import * as remote from './data-remote.js';

const provider = isSupabaseConfigured() ? remote : local;

export { ORDER_STATUSES, ORDER_TYPES, PAYMENT_METHODS, PRODUCT_CATEGORIES };

export const subscribe = (listener) => provider.subscribe(listener);
export const resetDemoStore = (...args) => provider.resetDemoStore(...args);
export const getSettings = (...args) => provider.getSettings(...args);
export const getDeliveryZones = (...args) => provider.getDeliveryZones(...args);
export const getDeliveryZone = (...args) => provider.getDeliveryZone(...args);
export const updateSettings = (...args) => provider.updateSettings(...args);
export const listProducts = (...args) => provider.listProducts(...args);
export const getProduct = (...args) => provider.getProduct(...args);
export const saveProduct = (...args) => provider.saveProduct(...args);
export const toggleProductAvailability = (...args) => provider.toggleProductAvailability(...args);
export const deleteProduct = (...args) => provider.deleteProduct(...args);
export const listOrders = (...args) => provider.listOrders(...args);
export const getOrderById = (...args) => provider.getOrderById(...args);
export const getPublicOrderStatus = (...args) => provider.getPublicOrderStatus(...args);
export const createOrder = (...args) => provider.createOrder(...args);
export const updateOrderStatus = (...args) => provider.updateOrderStatus(...args);
export const listTables = (...args) => provider.listTables(...args);
export const updateTableStatus = (...args) => provider.updateTableStatus(...args);
export const getTopProducts = (...args) => provider.getTopProducts(...args);
