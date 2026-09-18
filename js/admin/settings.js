import { requireAdmin } from '../services/auth-service.js';
import { isSupabaseConfigured } from '../services/supabase-config.js';
import { getSettings, resetDemoStore, subscribe, updateSettings } from '../services/store.js';
import { escapeHtml, formatCurrency, normalizeText } from '../utils/format.js';
import { renderAdminLayout } from './layout.js';

const session = await requireAdmin('../login/');

let draftZones = null;
let feedback = '';
let currentSettings = null;

function getZones() {
  return draftZones || currentSettings?.deliveryZones || [];
}

function zoneRowTemplate(zone, index) {
  return `
    <div class="zone-row" data-zone-index="${index}">
      <label class="form-field">
        <span>Zona</span>
        <input type="text" data-zone-field="name" value="${escapeHtml(zone.name)}" required>
      </label>
      <label class="form-field">
        <span>Costo de envío</span>
        <input type="number" data-zone-field="fee" min="0" step="500" value="${zone.fee}" required>
      </label>
      <label class="form-field">
        <span>Tiempo (min)</span>
        <input type="number" data-zone-field="etaMinutes" min="5" max="180" value="${zone.etaMinutes}" required>
      </label>
      <button class="admin-action admin-action--danger" type="button" data-remove-zone="${index}" aria-label="Eliminar zona ${escapeHtml(zone.name)}">
        Quitar
      </button>
    </div>
  `;
}

function renderForm(settings) {
  const zones = getZones();

  return `
    ${feedback ? `<p class="admin-feedback">${escapeHtml(feedback)}</p>` : ''}

    <form class="admin-form" id="settingsForm">
      <section class="admin-card">
        <h2>Información del restaurante</h2>

        <div class="admin-form__grid">
          <label class="form-field">
            <span>Nombre</span>
            <input type="text" name="restaurantName" value="${escapeHtml(settings.restaurantName)}" required>
          </label>
          <label class="form-field">
            <span>Teléfono</span>
            <input type="text" name="phone" value="${escapeHtml(settings.phone)}" required>
          </label>
        </div>

        <label class="form-field">
          <span>Descripción</span>
          <textarea name="description" rows="3" required>${escapeHtml(settings.description)}</textarea>
        </label>

        <div class="admin-form__grid">
          <label class="form-field">
            <span>WhatsApp (solo números)</span>
            <input type="text" name="whatsapp" value="${escapeHtml(settings.whatsapp)}" required>
          </label>
          <label class="form-field">
            <span>Instagram</span>
            <input type="text" name="instagram" value="${escapeHtml(settings.instagram)}">
          </label>
        </div>

        <label class="form-field">
          <span>Dirección</span>
          <input type="text" name="address" value="${escapeHtml(settings.address)}" required>
        </label>

        <label class="form-field">
          <span>Horario</span>
          <textarea name="hours" rows="3" required>${escapeHtml(settings.hours)}</textarea>
        </label>

        <label class="form-field">
          <span>Número de mesas</span>
          <input type="number" name="tableCount" min="1" max="80" value="${settings.tableCount}" required>
        </label>
      </section>

      <section class="admin-card">
        <h2>Domicilios</h2>
        <p class="order-card__meta">
          Controla si el sitio público acepta domicilios, el pedido mínimo y el costo por zona.
        </p>

        <label class="checkbox-field">
          <input type="checkbox" name="deliveryEnabled" ${settings.deliveryEnabled ? 'checked' : ''}>
          Aceptar pedidos a domicilio
        </label>

        <label class="form-field">
          <span>Pedido mínimo para domicilio</span>
          <input type="number" name="deliveryMinOrder" min="0" step="1000" value="${settings.deliveryMinOrder}" required>
        </label>

        <div class="zone-list">
          ${zones.length ? zones.map(zoneRowTemplate).join('') : '<p class="cart-empty">Agrega al menos una zona de entrega.</p>'}
        </div>

        <button class="admin-action admin-action--light" type="button" id="addZoneBtn">Agregar zona</button>
      </section>

      <div class="modal__actions">
        ${isSupabaseConfigured() ? '' : '<button class="btn btn--secondary btn--ink" type="button" id="resetDemoBtn">Restaurar demo</button>'}
        <button class="btn btn--primary" type="submit">Guardar configuración</button>
      </div>
    </form>
  `;
}

function readZonesFromForm() {
  return [...document.querySelectorAll('.zone-row')]
    .map((row) => {
      const read = (field) => row.querySelector(`[data-zone-field="${field}"]`).value;
      const name = read('name').trim();

      return {
        id: normalizeText(name).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `zona-${row.dataset.zoneIndex}`,
        name,
        fee: Math.max(0, Number(read('fee')) || 0),
        etaMinutes: Math.max(5, Number(read('etaMinutes')) || 30)
      };
    })
    .filter((zone) => zone.name);
}

function bindEvents() {
  document.querySelector('#settingsForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const submitButton = document.querySelector('#settingsForm button[type="submit"]');
    const formData = new FormData(event.currentTarget);
    const zones = readZonesFromForm();

    if (formData.get('deliveryEnabled') === 'on' && !zones.length) {
      feedback = 'Agrega al menos una zona de entrega para aceptar domicilios.';
      await render();
      return;
    }

    submitButton.disabled = true;

    try {
      await updateSettings({
        restaurantName: formData.get('restaurantName'),
        phone: formData.get('phone'),
        description: formData.get('description'),
        whatsapp: formData.get('whatsapp'),
        instagram: formData.get('instagram'),
        address: formData.get('address'),
        hours: formData.get('hours'),
        tableCount: formData.get('tableCount'),
        deliveryEnabled: formData.get('deliveryEnabled') === 'on',
        deliveryMinOrder: formData.get('deliveryMinOrder'),
        deliveryZones: zones
      });

      draftZones = null;
      feedback = 'Configuración guardada. Los cambios ya se ven en el sitio público.';
      await render();
    } catch (error) {
      feedback = error.message;
      submitButton.disabled = false;
      await render();
    }
  });

  document.querySelector('#addZoneBtn')?.addEventListener('click', () => {
    draftZones = [...readZonesFromForm(), { id: '', name: 'Nueva zona', fee: 8000, etaMinutes: 35 }];
    feedback = '';
    render();
  });

  document.querySelectorAll('[data-remove-zone]').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.removeZone);
      draftZones = readZonesFromForm().filter((_, position) => position !== index);
      feedback = '';
      render();
    });
  });

  document.querySelector('#resetDemoBtn')?.addEventListener('click', async () => {
    const confirmed = window.confirm('¿Restaurar productos, pedidos, mesas y configuración demo?');
    if (confirmed) {
      await resetDemoStore();
      draftZones = null;
      feedback = 'Datos demo restaurados.';
      await render();
    }
  });
}

async function render() {
  if (!session) return;

  currentSettings = await getSettings();

  await renderAdminLayout({
    active: 'settings',
    description: 'Datos del restaurante, cobertura de domicilios y costos de envío.',
    session,
    title: 'Configuración',
    actions: `<span class="admin-badge">Envío mínimo ${formatCurrency(currentSettings.deliveryMinOrder)}</span>`,
    content: renderForm(currentSettings)
  });

  bindEvents();
}

render();
subscribe(() => {
  if (!draftZones) render();
});
