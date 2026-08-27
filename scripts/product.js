import { cart, addToCart } from '../data/cart.js';
import { getproduct, loadProductsfetch } from '../data/products.js';
import { notifyError } from '../data/backend.js';
import { escapeHTML, safeImagePath } from './uitils/sanitize.js';
import { backendUrl } from '../data/backend.js';

const detail = document.querySelector('.product-detail');
const productId = new URLSearchParams(window.location.search).get('id');

function updateCartQuantity() {
  document.querySelector('.js-cart-quantity').textContent = cart.reduce((total, item) => total + item.quantity, 0);
}

function renderProduct(product) {
  if (!product) {
    detail.innerHTML = '<h1>Product not found</h1><p>This product is no longer available.</p>';
    return;
  }
  document.title = `${product.name} | Topazion`;
  detail.innerHTML = `<div class="detail-image"><img src="${safeImagePath(product.image)}" alt="${escapeHTML(product.name)}"></div>
    <div class="detail-copy"><p class="category">${escapeHTML(product.type || product.keywords?.[0] || 'Product')}</p><h1>${escapeHTML(product.name)}</h1>
    <div class="rating">${escapeHTML(product.rating.stars)} out of 5 stars (${escapeHTML(product.rating.count)} reviews)</div><p class="detail-price">${escapeHTML(product.getprice())}</p>
    <p class="stock">${product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</p>
    <label>Quantity <select class="detail-quantity" ${product.stock ? '' : 'disabled'}>${Array.from({ length: Math.min(product.stock, 10) }, (_, index) => `<option value="${index + 1}">${index + 1}</option>`).join('')}</select></label>
    <button class="button-primary detail-add" type="button" ${product.stock ? '' : 'disabled'}>${product.stock ? 'Add to Cart' : 'Out of stock'}</button><button class="wishlist-button button-secondary" type="button" aria-pressed="false">Save to wishlist</button></div>`;
  detail.querySelector('.detail-add')?.addEventListener('click', () => {
    if (!localStorage.getItem('topazionToken')) { window.location.href = 'login.html'; return; }
    try { addToCart(product.id, Number(detail.querySelector('.detail-quantity').value)); updateCartQuantity(); } catch (error) { notifyError(error); }
  });
}

async function loadReviews() {
  const response = await fetch(`${backendUrl}/products/${encodeURIComponent(productId)}/reviews`);
  const reviews = await response.json();
  document.querySelector('.review-list').innerHTML = reviews.length ? reviews.map((review) => `<article class="review"><strong>${escapeHTML(review.displayName)}</strong><span>${escapeHTML(review.rating)} / 5</span><p>${escapeHTML(review.review)}</p></article>`).join('') : '<p>No reviews yet.</p>';
}

async function setupWishlist() {
  const button = document.querySelector('.wishlist-button');
  if (!button) return;
  const token = localStorage.getItem('topazionToken');
  if (token) {
    const response = await fetch(`${backendUrl}/me/wishlist`, { headers: { Authorization: `Bearer ${token}` } });
    if (response.status === 401) {
      localStorage.removeItem('topazionToken');
      localStorage.removeItem('topazionUser');
      button.textContent = 'Save to wishlist';
      return;
    }
    const saved = await response.json();
    button.setAttribute('aria-pressed', String(saved.includes(productId)));
    button.textContent = saved.includes(productId) ? 'Saved to wishlist' : 'Save to wishlist';
  }
  button.addEventListener('click', async () => {
    const currentToken = localStorage.getItem('topazionToken');
    if (!currentToken) { window.location.href = 'login.html'; return; }
    const saved = button.getAttribute('aria-pressed') === 'true';
    const response = await fetch(`${backendUrl}/me/wishlist/${encodeURIComponent(productId)}`, { method: saved ? 'DELETE' : 'PUT', headers: { Authorization: `Bearer ${currentToken}` } });
    if (!response.ok) return;
    button.setAttribute('aria-pressed', String(!saved));
    button.textContent = saved ? 'Save to wishlist' : 'Saved to wishlist';
  });
}

function setupReviewForm() {
  const form = document.querySelector('.review-form');
  if (!localStorage.getItem('topazionToken')) return;
  form.hidden = false;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const response = await fetch(`${backendUrl}/products/${encodeURIComponent(productId)}/reviews`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('topazionToken')}` }, body: JSON.stringify({ rating: Number(data.get('rating')), review: data.get('review') }) });
    const result = await response.json();
    form.querySelector('.review-message').textContent = response.ok ? 'Review submitted.' : result.error;
    if (response.ok) { form.reset(); await loadReviews(); }
  });
}

await loadProductsfetch();
renderProduct(getproduct(productId));
updateCartQuantity();
await loadReviews();
await setupWishlist();
setupReviewForm();