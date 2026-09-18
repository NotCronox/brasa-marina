import { requireAdmin } from '../services/auth-service.js';
import {
  PRODUCT_CATEGORIES,
  deleteProduct,
  listProducts,
  saveProduct,
  subscribe,
  toggleProductAvailability
} from '../services/store.js';
import { escapeHtml, formatCurrency } from '../utils/format.js';
import { renderAdminLayout } from './layout.js';

const session = await requireAdmin('../login/');
let editingProductId = null;

function getEditingProduct() {
  return listProducts({ includeUnavailable: true }).find((product) => product.id === editingProductId);
}

function categoryOptions(selected) {
  return PRODUCT_CATEGORIES.map(
    (category) => `<option value="${category.id}" ${selected === category.id ? 'selected' : ''}>${category.label}</option>`
  ).join('');
}

function renderForm() {
  const product = getEditingProduct();

  return `
    <article class="admin-card">
      <h2>${product ? 'Editar producto' : 'Nuevo producto'}</h2>
      <form class="admin-form" id="productForm">
        <input type="hidden" name="id" value="${product?.id || ''}">

        <div class="admin-form__grid">
          <label class="form-field">
            <span>Nombre</span>
            <input type="text" name="name" value="${escapeHtml(product?.name)}" required>
          </label>
          <label class="form-field">
            <span>Precio</span>
            <input type="number" name="price" min="0" step="1000" value="${product?.price || ''}" required>
          </label>
        </div>

        <div class="admin-form__grid">
          <label class="form-field">
            <span>Categoría</span>
            <select name="category" required>${categoryOptions(product?.category || 'entradas')}</select>
          </label>
          <label class="form-field">
            <span>Etiqueta</span>
            <input type="text" name="tag" value="${escapeHtml(product?.tag || 'Carta')}" required>
          </label>
        </div>

        <label class="form-field">
          <span>Imagen</span>
          <input type="text" name="image" value="${escapeHtml(product?.image || 'assets/images/menu-ceviche-camaron.jpg')}" required>
        </label>

        <label class="form-field">
          <span>Descripción</span>
          <textarea name="description" rows="4" required>${escapeHtml(product?.description)}</textarea>
        </label>

        <label class="checkbox-field">
          <input type="checkbox" name="available" ${product?.available ?? true ? 'checked' : ''}>
          Disponible en carta
        </label>

        <label class="checkbox-field">
          <input type="checkbox" name="featured" ${product?.featured ? 'checked' : ''}>
          Mostrar como destacado
        </label>

        <div class="modal__actions">
          ${product ? '<button class="btn btn--secondary btn--ink" type="button" id="cancelEditBtn">Cancelar edición</button>' : ''}
          <button class="btn btn--primary" type="submit">${product ? 'Guardar cambios' : 'Crear producto'}</button>
        </div>
      </form>
    </article>
  `;
}

function renderProductCard(product) {
  const imageSrc = product.image.startsWith('http') ? product.image : `../../${product.image}`;

  return `
    <article class="product-admin-card">
      <img src="${escapeHtml(imageSrc)}" alt="${escapeHtml(product.name)}" class="product-admin-card__img">
      <div class="product-admin-card__head">
        <div>
          <h2>${escapeHtml(product.name)}</h2>
          <p>${escapeHtml(product.tag)} · ${escapeHtml(product.category)}</p>
        </div>
        <span class="status-badge status-badge--${product.available ? 'success' : 'danger'}">
          ${product.available ? 'Disponible' : 'Agotado'}
        </span>
      </div>
      <p>${escapeHtml(product.description)}</p>
      <strong class="product-admin-card__price">${formatCurrency(product.price)}</strong>
      <div class="product-admin-card__actions">
        <button class="admin-action" type="button" data-edit-product="${product.id}">Editar</button>
        <button class="admin-action admin-action--light" type="button" data-toggle-product="${product.id}">
          ${product.available ? 'Desactivar' : 'Activar'}
        </button>
        <button class="admin-action admin-action--danger" type="button" data-delete-product="${product.id}">Eliminar</button>
      </div>
    </article>
  `;
}

function bindEvents() {
  document.querySelector('#productForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const category = data.get('category');

    saveProduct({
      available: data.get('available') === 'on',
      category,
      description: data.get('description'),
      featured: data.get('featured') === 'on',
      filters: [category],
      id: data.get('id'),
      image: data.get('image'),
      name: data.get('name'),
      price: data.get('price'),
      tag: data.get('tag')
    });

    editingProductId = null;
    render();
  });

  document.querySelector('#cancelEditBtn')?.addEventListener('click', () => {
    editingProductId = null;
    render();
  });

  document.querySelectorAll('[data-edit-product]').forEach((button) => {
    button.addEventListener('click', () => {
      editingProductId = button.dataset.editProduct;
      render();
      document.querySelector('#productForm')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  document.querySelectorAll('[data-toggle-product]').forEach((button) => {
    button.addEventListener('click', () => {
      toggleProductAvailability(button.dataset.toggleProduct);
    });
  });

  document.querySelectorAll('[data-delete-product]').forEach((button) => {
    button.addEventListener('click', () => {
      const confirmed = window.confirm('¿Eliminar este producto del menú?');
      if (confirmed) deleteProduct(button.dataset.deleteProduct);
    });
  });
}

function render() {
  if (!session) return;

  const products = listProducts({ includeUnavailable: true });

  renderAdminLayout({
    active: 'products',
    description: 'Administra precios, imágenes, categorías y disponibilidad.',
    session,
    title: 'Menú',
    content: `
      <section class="admin-grid admin-grid--two">
        ${renderForm()}
        <article class="admin-card">
          <h2>Resumen</h2>
          <div class="admin-list">
            <article class="admin-list-item">
              <strong>Productos activos</strong>
              <span>${products.filter((product) => product.available).length}</span>
            </article>
            <article class="admin-list-item">
              <strong>Agotados</strong>
              <span>${products.filter((product) => !product.available).length}</span>
            </article>
            <article class="admin-list-item">
              <strong>Categorías</strong>
              <span>${PRODUCT_CATEGORIES.length}</span>
            </article>
          </div>
        </article>
      </section>

      <section class="products-grid" style="margin-top: 22px;">
        ${products.map(renderProductCard).join('')}
      </section>
    `
  });

  bindEvents();
}

render();
subscribe(render);
