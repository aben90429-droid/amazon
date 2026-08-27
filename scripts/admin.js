import { backendUrl } from '../data/backend.js';
import { escapeHTML } from './uitils/sanitize.js';

const API_URL = backendUrl;
const signedInUser = JSON.parse(localStorage.getItem('topazionUser') || 'null');
const token = localStorage.getItem('topazionToken');

if (!signedInUser || signedInUser.role !== 'owner') {
  window.location.href = 'login.html';
} else {
  loadProducts();
}
const form = document.querySelector('#product-form');
const productList = document.querySelector('#product-list');
const statusElement = document.querySelector('#status');
const orderList = document.querySelector('#order-list');

function showStatus(message, isError = false) {
  statusElement.textContent = message;
  statusElement.className = `status${isError ? ' error' : ''}`;
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers }
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || `Request failed (${response.status}).`);
  }
  return payload;
}

function productPayload(formData) {
  return {
    name: formData.get('name').trim(),
    image: formData.get('image').trim(),
    priceCents: Number(formData.get('priceCents')),
    stock: Number(formData.get('stock')),
    rating: {
      stars: Number(formData.get('stars')),
      count: Number(formData.get('ratingCount'))
    },
    keywords: formData.get('keywords').split(',').map((keyword) => keyword.trim()).filter(Boolean)
  };
}

function renderProducts(products) {
  productList.innerHTML = products.map((product) => `
    <tr data-product-id="${escapeHTML(product.id)}">
      <td><strong>${escapeHTML(product.name)}</strong><small>${escapeHTML(product.id)}</small></td>
      <td>$${(product.priceCents / 100).toFixed(2)}</td>
      <td><input class="stock-input" type="number" min="0" value="${product.stock}" aria-label="Stock for ${escapeHTML(product.name)}"></td>
      <td class="actions"><button class="save-button" type="button">Save stock</button><button class="delete-button" type="button">Delete</button></td>
    </tr>`).join('');
}

async function loadProducts() {
  try {
    renderProducts(await apiRequest('/products'));
    showStatus('Database connected');
  } catch (error) {
    showStatus(error.message, true);
  }
}

function renderOrders(orders) {
  orderList.innerHTML = orders.length ? orders.map((order) => `<tr data-order-id="${escapeHTML(order.orderId)}"><td><strong>${escapeHTML(order.orderId.slice(0, 8))}</strong><small>${escapeHTML(order.createdAt)}</small></td><td>${escapeHTML(order.displayName)}<small>@${escapeHTML(order.username)}</small></td><td><select class="order-status" aria-label="Status for order ${escapeHTML(order.orderId.slice(0, 8))}"><option ${order.status === 'processing' ? 'selected' : ''}>processing</option><option ${order.status === 'shipped' ? 'selected' : ''}>shipped</option><option ${order.status === 'delivered' ? 'selected' : ''}>delivered</option><option ${order.status === 'cancelled' ? 'selected' : ''}>cancelled</option></select></td><td>${escapeHTML(order.refundStatus)}</td><td>${order.refundStatus === 'requested' ? '<button class="approve-refund" type="button">Approve refund</button><button class="reject-refund" type="button">Reject refund</button>' : '-'}</td></tr>`).join('') : '<tr><td colspan="5">No orders yet.</td></tr>';
}

async function loadOrders() {
  try { renderOrders(await apiRequest('/admin/orders')); } catch (error) { showStatus(error.message, true); }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    await apiRequest('/products', { method: 'POST', body: JSON.stringify(productPayload(new FormData(form))) });
    form.reset();
    showStatus('Product added');
    await loadProducts();
  } catch (error) {
    showStatus(error.message, true);
  }
});

productList.addEventListener('click', async (event) => {
  const row = event.target.closest('tr');
  if (!row) return;
  const productId = row.dataset.productId;
  try {
    const products = await apiRequest('/products');
    const product = products.find((item) => item.id === productId);
    if (event.target.classList.contains('delete-button')) {
      await apiRequest(`/products/${productId}`, { method: 'DELETE' });
      showStatus('Product deleted');
    } else if (event.target.classList.contains('save-button')) {
      product.stock = Number(row.querySelector('.stock-input').value);
      await apiRequest(`/products/${productId}`, { method: 'PUT', body: JSON.stringify(product) });
      showStatus('Stock updated');
    }
    await loadProducts();
  } catch (error) {
    showStatus(error.message, true);
  }
});

orderList.addEventListener('change', async (event) => {
  if (!event.target.classList.contains('order-status')) return;
  try { await apiRequest(`/admin/orders/${event.target.closest('tr').dataset.orderId}`, { method: 'PATCH', body: JSON.stringify({ status: event.target.value }) }); showStatus('Order status updated'); } catch (error) { showStatus(error.message, true); await loadOrders(); }
});

orderList.addEventListener('click', async (event) => {
  if (!event.target.classList.contains('approve-refund') && !event.target.classList.contains('reject-refund')) return;
  const refundStatus = event.target.classList.contains('approve-refund') ? 'approved' : 'rejected';
  try { await apiRequest(`/admin/orders/${event.target.closest('tr').dataset.orderId}/refund`, { method: 'PATCH', body: JSON.stringify({ refundStatus }) }); showStatus('Refund updated'); await loadOrders(); } catch (error) { showStatus(error.message, true); }
});

document.querySelector('#refresh-button').addEventListener('click', loadProducts);
document.querySelector('#refresh-orders-button').addEventListener('click', loadOrders);
loadOrders();
