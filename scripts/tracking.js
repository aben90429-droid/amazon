import { cart, loadCart } from '../data/cart.js';
import { products, loadProductsfetch } from '../data/products.js';

async function loadPage() {
  try {
    // Load products first
    await loadProductsfetch();

    // Load cart from backend
    await new Promise((resolve) => {
      loadCart(() => {
        resolve();
      });
    });

    // Render tracking information
    renderTracking();
  } catch (error) {
    console.log('error loading page:', error);
  }
}

async function renderTracking() {
  // Get the URL parameters to determine which product to show
  const url = new URL(window.location.href);
  const productIdParam = url.searchParams.get('productId');
  const orderIdParam = url.searchParams.get('orderId');

  // Find the matching item in the cart
  let trackingItem = null;

  const savedOrder = orderIdParam ? await loadSavedOrder(orderIdParam) : null;
  const orderItems = savedOrder ? savedOrder.cart : cart;

  if (productIdParam) {
    // If productId is provided in URL, find it in cart
    trackingItem = orderItems.find(item => item.productId === productIdParam);
  } else if (orderItems.length > 0) {
    // Otherwise, show the first item in cart
    trackingItem = orderItems[0];
  }

  if (!trackingItem) {
    // No items in cart, show a message
    document.querySelector('.order-tracking').innerHTML = `
      <a class="back-to-orders-link link-primary" href="orders.html">
        View all orders
      </a>
      <p style="margin-top: 30px; font-size: 18px; color: rgb(150, 150, 150);">
        No items to track. Your cart is empty.
      </p>
    `;
    return;
  }

  // Find the product details
  const product = products.find(p => p.id === trackingItem.productId);

  if (!product) {
    console.log('Product not found');
    return;
  }

  // Generate a delivery date (example: 5 days from now)
  const deliveryDate = generateDeliveryDate();

  // Update the tracking HTML
  const trackingHTML = `
    <a class="back-to-orders-link link-primary" href="orders.html">
      View all orders
    </a>

    <div class="delivery-date">
      Arriving on ${deliveryDate}
    </div>

    <div class="product-info">
      ${product.name}
    </div>

    <div class="product-info">
      Quantity: ${trackingItem.quantity}
    </div>
    
    <img class="product-image" src="${product.image}">

    <div class="progress-labels-container">
      <div class="progress-label">
        Preparing
      </div>
      <div class="progress-label current-status">
        Shipped
      </div>
      <div class="progress-label">
        Delivered
      </div>
    </div>

    <div class="progress-bar-container">
      <div class="progress-bar"></div>
    </div>
  `;

  document.querySelector('.order-tracking').innerHTML = trackingHTML;

  // Update the cart quantity in the header
  updateCartQuantity();
}

async function loadSavedOrder(orderId) {
  const token = localStorage.getItem('topazionToken');
  if (!token) return null;
  const response = await fetch('http://localhost:8000/me/orders', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) return null;
  const orders = await response.json();
  return orders.find(order => order.orderId === orderId) || null;
}

function generateDeliveryDate() {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 5);
  
  const dayName = days[futureDate.getDay()];
  const monthName = months[futureDate.getMonth()];
  const date = futureDate.getDate();
  
  return `${dayName}, ${monthName} ${date}`;
}

function updateCartQuantity() {
  // Calculate total quantity in cart
  let totalQuantity = 0;
  cart.forEach(item => {
    totalQuantity += item.quantity;
  });

  // Update cart quantity in header
  document.querySelector('.cart-quantity').textContent = totalQuantity;
}

// Load the page when it's ready
loadPage();
