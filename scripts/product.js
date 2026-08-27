import { cart, addToCart } from '../data/cart.js';
import { getproduct, loadProductsfetch } from '../data/products.js';
import { notifyError } from '../data/backend.js';
import { escapeHTML, safeImagePath } from './uitils/sanitize.js';

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
    <button class="button-primary detail-add" type="button" ${product.stock ? '' : 'disabled'}>${product.stock ? 'Add to Cart' : 'Out of stock'}</button></div>`;
  detail.querySelector('.detail-add')?.addEventListener('click', () => {
    if (!localStorage.getItem('topazionToken')) { window.location.href = 'login.html'; return; }
    try { addToCart(product.id, Number(detail.querySelector('.detail-quantity').value)); updateCartQuantity(); } catch (error) { notifyError(error); }
  });
}

await loadProductsfetch();
renderProduct(getproduct(productId));
updateCartQuantity();