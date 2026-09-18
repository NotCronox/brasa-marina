import { ORDER_FLOWS, ORDER_STATUSES, ORDER_TYPES, PAYMENT_METHODS, STATUS_LABELS_BY_TYPE } from '../data/demo-data.js';

export const formatCurrency = (value) =>
  new Intl.NumberFormat('es-CO', {
    currency: 'COP',
    maximumFractionDigits: 0,
    style: 'currency'
  }).format(Number(value || 0));

export const formatDateTime = (value) =>
  new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));

export const formatTime = (value) =>
  new Intl.DateTimeFormat('es-CO', { timeStyle: 'short' }).format(new Date(value));

export const formatRelativeTime = (value) => {
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 1) return 'hace un momento';
  if (minutes < 60) return `hace ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  return `hace ${Math.floor(hours / 24)} d`;
};

export const normalizeText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

export const escapeHtml = (value) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

export const onlyDigits = (value) => String(value || '').replace(/\D/g, '');

export const isValidPhone = (value) => {
  const digits = onlyDigits(value);
  return digits.length >= 7 && digits.length <= 13;
};

export const formatPhone = (value) => {
  const digits = onlyDigits(value);
  if (digits.length === 10) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  return String(value || '');
};

export const toWhatsappNumber = (value) => {
  const digits = onlyDigits(value);
  if (!digits) return '';
  return digits.length === 10 ? `57${digits}` : digits;
};

export const getOrderTypeMeta = (orderType) =>
  ORDER_TYPES[orderType] || { label: orderType, short: orderType };

export const getOrderFlow = (orderType) => ORDER_FLOWS[orderType] || ORDER_FLOWS.table;

export const getStatusMeta = (status, orderType) => {
  const meta = ORDER_STATUSES[status] || { label: status, tone: 'neutral' };
  const override = STATUS_LABELS_BY_TYPE[orderType]?.[status];
  return override ? { ...meta, label: override } : meta;
};

export const getPaymentLabel = (methodId) =>
  PAYMENT_METHODS.find((method) => method.id === methodId)?.label || 'Por definir';

export const getOrderLabel = (order) => {
  if (!order) return '';
  if (order.orderType === 'table') return `Mesa ${order.tableNumber}`;
  if (order.orderType === 'delivery') return `Domicilio · ${order.delivery?.zoneName || 'Cartagena'}`;
  return 'Para llevar';
};

export const createId = (prefix) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const toMoneyNumber = (value) => {
  const clean = String(value || '').replace(/[^\d]/g, '');
  return Number(clean || 0);
};

export const todayKey = (date = new Date()) => {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 10);
};

export const isToday = (value) => todayKey(new Date(value)) === todayKey();
