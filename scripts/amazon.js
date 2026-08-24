import { cart, addToCart } from '../data/cart.js';
import { notifyError } from '../data/backend.js';
import { products,loadProducts } from '../data/products.js';
import { formatcurrency } from './uitils/money.js';
import { setupAccountMenu } from './account.js';

setupAccountMenu();
loadProducts(renderProductsGrid);

function getSearchValue() {
  const searchInput = document.querySelector('.search-bar');
  return searchInput ? searchInput.value.trim().toLowerCase() : '';
}

function renderProductsGrid() {
  const searchTerm = getSearchValue();
  const visibleProducts = !searchTerm
    ? products
    : products.filter((product) => {
        const haystack = [
          product.name,
          product.category,
          ...(product.keywords || []),
          ...(product.type ? [product.type] : []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(searchTerm);
      });

  let productHTML = '';

  if (visibleProducts.length === 0) {
    productHTML = `
      <div class="no-results" style="grid-column: 1 / -1; padding: 40px 20px; text-align: center; color: rgb(108, 119, 114);">
        No products match your search. Try a different keyword.
      </div>
    `;
  } else {
    visibleProducts.forEach((product) => {
      productHTML += `
        <div class="product-container">
          <div class="product-image-container">
            <img class="product-image" src="${product.image}" alt="${product.name}">
          </div>

          <div class="product-name limit-text-to-2-lines">${product.name}</div>

          <div class="product-rating-container">
            <img class="product-rating-stars" src="${product.getstarsUrl()}" alt="${product.rating.stars} out of 5 stars">
            <div class="product-rating-count link-primary">${product.rating.count}</div>
          </div>

          <div class="product-price">${product.getprice()}</div>

          <div class="product-stock">${product.stock} in stock</div>

          <div class="product-quantity-container js-product-quantity-container${product.id}">
            <select>
              <option selected value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
              <option value="7">7</option>
              <option value="8">8</option>
              <option value="9">9</option>
              <option value="10">10</option>
            </select>
          </div>

          ${product.extrainfoHtML()}

          <div class="product-spacer"></div>

          <div class="added-to-cart">
            <img src="images/icons/checkmark.png" alt="Added">
            Added
          </div>

          <button class="add-to-cart-button button-primary js-rell" data-product-id="${product.id}">
            Add to Cart
          </button>
        </div>`;
    });
  }

  const productGrid = document.querySelector('.js-product-grid');
  if (productGrid) {
    productGrid.innerHTML = productHTML;
  }

  function updateCartQuantity() {
    let cartQuantity = 0;

    cart.forEach((cartItem) => {
      cartQuantity += cartItem.quantity;
    });

    const quantityNode = document.querySelector('.js-cart-quantity');
    if (quantityNode) {
      quantityNode.innerHTML = cartQuantity;
    }
  }

  document.querySelectorAll('.js-rell').forEach((button) => {
    button.addEventListener('click', () => {
      if (!localStorage.getItem('topazionToken')) {
        window.location.href = 'login.html';
        return;
      }
      const productId = button.dataset.productId;
      const selectElement = button.closest('.product-container').querySelector('select');
      const selectedQuantity = parseInt(selectElement.value, 10);

      try {
        addToCart(productId, selectedQuantity);
      } catch (error) {
        notifyError(error);
        return;
      }

      updateCartQuantity();
    });
  });

  const cartQuantity2 = document.querySelector('.js-cart-quantity2');
  if (cartQuantity2) {
    cartQuantity2.innerHTML = String(cart.length);
  }

  updateCartQuantity();
}

const searchInput = document.querySelector('.search-bar');
const searchButton = document.querySelector('.search-button');

if (searchInput) {
  searchInput.addEventListener('input', renderProductsGrid);
  searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      renderProductsGrid();
    }
  });
}

if (searchButton) {
  searchButton.addEventListener('click', () => {
    renderProductsGrid();
  });
}
/*
this is a start of a great legacy that i will build in my life time this will be a note tha i promise my self to be the gratest software engineer that has passed through this life 
i have started a journey that will end in death */
