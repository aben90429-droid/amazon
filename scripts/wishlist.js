import { backendUrl } from '../data/backend.js';
import { loadProductsfetch, products } from '../data/products.js';
import { addToCart, cart } from '../data/cart.js';
import { escapeHTML, safeImagePath } from './uitils/sanitize.js';
import { notifyError } from '../data/backend.js';

const token = localStorage.getItem('topazionToken');
const grid = document.querySelector('.wishlist-grid');

if (!token) {
  window.location.href = 'login.html';
} else {
  await loadProductsfetch();
  const response = await fetch(`${backendUrl}/me/wishlist`, { headers: { Authorization: `Bearer ${token}` } });
  if (response.status === 401) {
    localStorage.removeItem('topazionToken');
    localStorage.removeItem('topazionUser');
    window.location.href = 'login.html';
  }
  const ids = await response.json();
  const savedProducts = products.filter((product) => ids.includes(product.id));
  grid.innerHTML = savedProducts.length ? savedProducts.map((product) => `<article class="product-container"><div class="product-image-container"><a href="product.html?id=${encodeURIComponent(product.id)}"><img class="product-image" src="${safeImagePath(product.image)}" alt="${escapeHTML(product.name)}"></a></div><a class="product-name product-link" href="product.html?id=${encodeURIComponent(product.id)}">${escapeHTML(product.name)}</a><div class="product-price">${escapeHTML(product.getprice())}</div><button class="button-primary wishlist-add" data-product-id="${encodeURIComponent(product.id)}" type="button">Add to cart</button><button class="button-secondary wishlist-remove" data-product-id="${encodeURIComponent(product.id)}" type="button">Remove</button></article>`).join('') : '<p>Your wishlist is empty. Save products to find them here.</p>';
  document.querySelector('.js-cart-quantity').textContent = cart.reduce((total, item) => total + item.quantity, 0);
  grid.addEventListener('click', async (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const productId = decodeURIComponent(button.dataset.productId);
    if (button.classList.contains('wishlist-add')) {
      if (!localStorage.getItem('topazionToken')) { window.location.href = 'login.html'; return; }
      try { addToCart(productId); button.textContent = 'Added to cart'; } catch (error) { notifyError(error); }
    } else if (button.classList.contains('wishlist-remove')) {
      await fetch(`${backendUrl}/me/wishlist/${encodeURIComponent(productId)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      button.closest('.product-container').remove();
    }
  });
}
