import { products, loadProductsfetch, getproduct } from '../data/products.js';
import { getdeliveryoption } from '../data/delivery.js';
import { formatcurrency } from './uitils/money.js';
import { backendUrl } from '../data/backend.js';
import { escapeHTML, safeImagePath } from './uitils/sanitize.js';

function getOrderTotal(order) {
  return order.cart.reduce((total, cartItem) => {
    const product = getproduct(cartItem.productId);
    const deliveryOption = getdeliveryoption(cartItem.deliveryOptionId);
    if (!product || !deliveryOption) return total;
    return total + (product.priceCents + deliveryOption.pricecents) * cartItem.quantity;
  }, 0) * 1.1;
}

function getDeliveryDate(cartItem) {
  const deliveryOption = getdeliveryoption(cartItem.deliveryOptionId);
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + (deliveryOption?.deliveryDate || 5));
  return deliveryDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
}

function renderOrders(orders) {
  const ordersGrid = document.querySelector('.js-orders-grid');
  if (!ordersGrid) return;

  if (orders.length === 0) {
    ordersGrid.innerHTML = '<p>No orders yet.</p>';
    return;
  }

  ordersGrid.innerHTML = orders.map((order) => {
    const orderDate = order.createdAt
      ? new Date(order.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })
      : 'Recently';
    const items = order.cart.map((cartItem) => {
      const product = products.find((item) => item.id === cartItem.productId);
      if (!product) return '';

      return `
        <div class="product-image-container">
          <img src="${safeImagePath(product.image)}" alt="${escapeHTML(product.name)}">
        </div>
        <div class="product-details">
          <div class="product-name">${escapeHTML(product.name)}</div>
          <div class="product-delivery-date">Arriving on: ${getDeliveryDate(cartItem)}</div>
          <div class="product-quantity">Quantity: ${cartItem.quantity}</div>
          <div class="product-price">${product.getprice()}</div>
        </div>
        <div class="product-actions">
          <a href="tracking.html?orderId=${order.orderId}&productId=${product.id}">
            <button class="track-package-button button-secondary">Track package</button>
          </a>
        </div>`;
    }).join('');

    return `
      <div class="order-container">
        <div class="order-header">
          <div class="order-header-left-section">
            <div class="order-date">
              <div class="order-header-label">Order Placed:</div>
              <div>${orderDate}</div>
            </div>
            <div class="order-total">
              <div class="order-header-label">Total:</div>
              <div>$${formatcurrency(getOrderTotal(order))}</div>
            </div>
          </div>
            <div class="order-header-right-section">
            <div class="order-header-label">Order ID:</div>
            <div>${escapeHTML(order.orderId)}</div>
            <div class="order-status status-${escapeHTML(order.status)}">${escapeHTML(order.status)}</div>
            ${order.refundStatus !== 'not_requested' ? `<div class="refund-status">Refund: ${escapeHTML(order.refundStatus)}</div>` : ''}
            ${order.status === 'processing' ? `<button class="cancel-order-button button-secondary" data-order-id="${order.orderId}" type="button">Cancel order</button>` : ''}
          </div>
        </div>
        <div class="order-details-grid">${items}</div>
      </div>`;
  }).join('');

  ordersGrid.querySelectorAll('.cancel-order-button').forEach((button) => {
    button.addEventListener('click', async () => {
      button.disabled = true;
      try {
        const response = await fetch(`${backendUrl}/me/orders/${button.dataset.orderId}/cancel`, {
          method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('topazionToken')}` }
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not cancel this order.');
        await loadOrdersPage();
      } catch (error) {
        button.disabled = false;
        button.textContent = error.message;
      }
    });
  });
}

async function loadOrdersPage() {
  const token = localStorage.getItem('topazionToken');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  try {
    await loadProductsfetch();
    const response = await fetch(`${backendUrl}/me/orders`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Could not load your orders.');
    renderOrders(payload);
  } catch (error) {
    document.querySelector('.js-orders-grid').innerHTML = `<p>${error.message}</p>`;
  }
}

loadOrdersPage();
