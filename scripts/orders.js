import { products, loadProductsfetch, getproduct } from '../data/products.js';
import { getdeliveryoption } from '../data/delivery.js';
import { formatcurrency } from './uitils/money.js';

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
          <img src="${product.image}" alt="${product.name}">
        </div>
        <div class="product-details">
          <div class="product-name">${product.name}</div>
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
            <div>${order.orderId}</div>
          </div>
        </div>
        <div class="order-details-grid">${items}</div>
      </div>`;
  }).join('');
}

async function loadOrdersPage() {
  const token = localStorage.getItem('topazionToken');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  try {
    await loadProductsfetch();
    const response = await fetch('http://localhost:8000/me/orders', {
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
