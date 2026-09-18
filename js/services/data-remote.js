import { getSupabaseClient } from './supabase-client.js';

const REALTIME_TABLES = ['orders', 'order_items', 'products', 'tables', 'restaurant_settings', 'delivery_zones'];
const listeners = new Set();
let realtimeReady = false;

async function client() {
  return getSupabaseClient();
}

function notify() {
  listeners.forEach((listener) => listener());
}

async function ensureRealtime() {
  if (realtimeReady) return;
  realtimeReady = true;

  const supabase = await client();
  let channelBuilder = supabase.channel('brasa-marina-realtime');

  REALTIME_TABLES.forEach((table) => {
    channelBuilder = channelBuilder.on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      notify
    );
  });

  channelBuilder.subscribe();
}

export function subscribe(listener) {
  listeners.add(listener);
  ensureRealtime();
  return () => listeners.delete(listener);
}

function unwrap({ data, error }) {
  if (error) throw new Error(error.message || 'Error de conexión con la base de datos.');
  return data;
}

function mapProduct(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    image: row.image,
    category: row.category,
    filters: row.filters?.length ? row.filters : [row.category],
    tag: row.tag,
    available: row.available,
    featured: row.featured,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapTable(row) {
  return {
    id: row.id,
    number: row.number,
    status: row.status,
    updatedAt: row.updated_at
  };
}

function mapZone(row) {
  return {
    id: row.id,
    name: row.name,
    fee: row.fee,
    etaMinutes: row.eta_minutes
  };
}

function mapSettings(row, zones) {
  return {
    restaurantName: row.restaurant_name,
    description: row.description,
    phone: row.phone,
    whatsapp: row.whatsapp,
    address: row.address,
    hours: row.hours,
    instagram: row.instagram,
    tableCount: row.table_count,
    deliveryEnabled: row.delivery_enabled,
    deliveryMinOrder: row.delivery_min_order,
    deliveryZones: zones.map(mapZone)
  };
}

function mapOrder(row, items = []) {
  return {
    id: row.id,
    number: row.number,
    lookupToken: row.lookup_token,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    tableNumber: row.table_number,
    orderType: row.order_type,
    notes: row.notes,
    subtotal: row.subtotal,
    deliveryFee: row.delivery_fee,
    delivery:
      row.order_type === 'delivery'
        ? {
            address: row.delivery_address,
            zoneId: row.delivery_zone_id,
            zoneName: row.delivery_zone_name,
            reference: row.delivery_reference,
            etaMinutes: row.delivery_eta_minutes
          }
        : null,
    payment: row.payment_method ? { method: row.payment_method, changeFor: row.change_for } : null,
    total: row.total,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: items.map((item) => ({
      productId: item.product_id,
      name: item.name || 'Producto eliminado',
      quantity: item.quantity,
      unitPrice: item.unit_price,
      subtotal: item.subtotal
    }))
  };
}

export async function getDeliveryZones() {
  const supabase = await client();
  const rows = unwrap(await supabase.from('delivery_zones').select('*').eq('active', true).order('fee'));
  return rows.map(mapZone);
}

export async function getDeliveryZone(zoneId) {
  return (await getDeliveryZones()).find((zone) => zone.id === zoneId) || null;
}

export async function getSettings() {
  const supabase = await client();
  const [settingsRow, zones] = await Promise.all([
    supabase
      .from('restaurant_settings')
      .select('*')
      .eq('id', 1)
      .single()
      .then(unwrap),
    getDeliveryZones()
  ]);

  return mapSettings(settingsRow, zones.map((zone) => ({ ...zone, eta_minutes: zone.etaMinutes })));
}

export async function updateSettings(payload) {
  const supabase = await client();

  unwrap(
    await supabase
      .from('restaurant_settings')
      .update({
        restaurant_name: payload.restaurantName,
        description: payload.description,
        phone: payload.phone,
        whatsapp: payload.whatsapp,
        address: payload.address,
        hours: payload.hours,
        instagram: payload.instagram,
        table_count: Math.max(1, Number(payload.tableCount || 20)),
        delivery_enabled: Boolean(payload.deliveryEnabled),
        delivery_min_order: Math.max(0, Number(payload.deliveryMinOrder || 0))
      })
      .eq('id', 1)
  );

  if (payload.deliveryZones?.length) {
    const zoneRows = payload.deliveryZones.map((zone) => ({
      id: zone.id,
      name: zone.name,
      fee: zone.fee,
      eta_minutes: zone.etaMinutes,
      active: true
    }));

    unwrap(await supabase.from('delivery_zones').upsert(zoneRows, { onConflict: 'id' }));

    const keepIds = zoneRows.map((zone) => zone.id);
    unwrap(await supabase.from('delivery_zones').update({ active: false }).not('id', 'in', `(${keepIds.map((id) => `"${id}"`).join(',')})`));
  }

  const wantedCount = Math.max(1, Number(payload.tableCount || 20));
  const existingTables = unwrap(await supabase.from('tables').select('number'));
  const currentCount = existingTables.length;

  if (wantedCount > currentCount) {
    const newRows = [];
    for (let number = currentCount + 1; number <= wantedCount; number += 1) {
      newRows.push({ number, status: 'free' });
    }
    unwrap(await supabase.from('tables').insert(newRows));
  }

  if (wantedCount < currentCount) {
    unwrap(await supabase.from('tables').delete().gt('number', wantedCount));
  }

  return getSettings();
}

export async function listProducts(options = {}) {
  const supabase = await client();
  let query = supabase.from('products').select('*').order('created_at', { ascending: false });
  if (!options.includeUnavailable) query = query.eq('available', true);
  const rows = unwrap(await query);
  return rows.map(mapProduct);
}

export async function getProduct(productId) {
  const supabase = await client();
  const { data, error } = await supabase.from('products').select('*').eq('id', productId).maybeSingle();
  if (error) throw new Error(error.message);
  return mapProduct(data);
}

export async function saveProduct(payload) {
  const supabase = await client();
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
    const row = unwrap(
      await supabase.from('products').update(normalized).eq('id', payload.id).select('*').single()
    );
    return mapProduct(row);
  }

  const row = unwrap(await supabase.from('products').insert(normalized).select('*').single());
  return mapProduct(row);
}

export async function toggleProductAvailability(productId) {
  const supabase = await client();
  const current = unwrap(
    await supabase.from('products').select('available').eq('id', productId).single()
  );
  const row = unwrap(
    await supabase
      .from('products')
      .update({ available: !current.available })
      .eq('id', productId)
      .select('*')
      .single()
  );
  return mapProduct(row);
}

export async function deleteProduct(productId) {
  const supabase = await client();
  const { error } = await supabase.from('products').delete().eq('id', productId);
  if (error) throw new Error(error.message);
  return true;
}

async function attachItems(supabase, orders) {
  if (!orders.length) return orders.map((order) => mapOrder(order, []));

  const items = unwrap(
    await supabase
      .from('order_items')
      .select('*')
      .in(
        'order_id',
        orders.map((order) => order.id)
      )
  );

  return orders.map((order) => mapOrder(order, items.filter((item) => item.order_id === order.id)));
}

export async function listOrders() {
  const supabase = await client();
  const orders = unwrap(await supabase.from('orders').select('*').order('created_at', { ascending: false }));
  return attachItems(supabase, orders);
}

export async function getOrderById(orderId) {
  const supabase = await client();
  const { data: order, error } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!order) return null;
  const [mapped] = await attachItems(supabase, [order]);
  return mapped;
}

export async function getPublicOrderStatus({ number, lookupToken }) {
  const supabase = await client();
  const { data, error } = await supabase.rpc('get_public_order', {
    input_number: Number(number),
    input_lookup_token: lookupToken
  });

  if (error) throw new Error(error.message);
  if (!data) return null;

  return {
    id: data.id,
    number: data.number,
    lookupToken,
    customerName: data.customer_name,
    customerPhone: data.customer_phone,
    tableNumber: data.table_number,
    orderType: data.order_type,
    notes: data.notes,
    subtotal: data.subtotal,
    deliveryFee: data.delivery_fee,
    delivery: data.delivery
      ? {
          address: data.delivery.address,
          zoneId: data.delivery.zone_id,
          zoneName: data.delivery.zone_name,
          reference: data.delivery.reference,
          etaMinutes: data.delivery.eta_minutes
        }
      : null,
    payment: data.payment ? { method: data.payment.method, changeFor: data.payment.change_for } : null,
    total: data.total,
    status: data.status,
    createdAt: data.created_at,
    statusHistory: (data.status_history || []).map((entry) => ({ status: entry.status, at: entry.at })),
    items: (data.items || []).map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      subtotal: item.subtotal
    }))
  };
}

export async function createOrder(payload) {
  const supabase = await client();
  const { data, error } = await supabase.rpc('create_public_order', {
    input_customer_name: payload.customerName || null,
    input_customer_phone: payload.customerPhone || null,
    input_table_number: payload.orderType === 'table' ? Number(payload.tableNumber) : null,
    input_order_type: payload.orderType,
    input_notes: payload.notes || null,
    input_items: payload.items.map((item) => ({ product_id: item.productId, quantity: item.quantity })),
    input_delivery_zone_id: payload.orderType === 'delivery' ? payload.deliveryZoneId : null,
    input_delivery_address: payload.orderType === 'delivery' ? payload.deliveryAddress : null,
    input_delivery_reference: payload.orderType === 'delivery' ? payload.deliveryReference || null : null,
    input_payment_method: payload.orderType === 'delivery' ? payload.paymentMethod : null,
    input_change_for:
      payload.orderType === 'delivery'
        ? Number(String(payload.changeFor || '').replace(/[^\d]/g, '')) || null
        : null
  });

  if (error) throw new Error(error.message.replace(/^.*: /, ''));

  return {
    id: data.id,
    number: data.number,
    lookupToken: data.lookup_token,
    status: data.status,
    subtotal: data.subtotal,
    deliveryFee: data.delivery_fee,
    total: data.total,
    orderType: payload.orderType,
    createdAt: new Date().toISOString()
  };
}

export async function updateOrderStatus(orderId, status) {
  const supabase = await client();
  const row = unwrap(
    await supabase.from('orders').update({ status }).eq('id', orderId).select('*').single()
  );
  const [mapped] = await attachItems(supabase, [row]);
  return mapped;
}

export async function listTables() {
  const supabase = await client();
  const rows = unwrap(await supabase.from('tables').select('*').order('number'));
  return rows.map(mapTable);
}

export async function updateTableStatus(tableNumber, status) {
  const supabase = await client();
  const row = unwrap(
    await supabase
      .from('tables')
      .update({ status })
      .eq('number', Number(tableNumber))
      .select('*')
      .single()
  );
  return mapTable(row);
}

export async function getTopProducts(limit = 5) {
  const orders = await listOrders();
  const totals = new Map();

  orders
    .filter((order) => order.status !== 'cancelled')
    .forEach((order) => {
      order.items.forEach((item) => {
        const current = totals.get(item.productId) || { name: item.name, quantity: 0, total: 0 };
        current.quantity += item.quantity;
        current.total += item.subtotal;
        totals.set(item.productId, current);
      });
    });

  return [...totals.values()]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit);
}

export async function resetDemoStore() {
  throw new Error('Este sitio está conectado a Supabase: no hay un "demo" que restaurar.');
}
