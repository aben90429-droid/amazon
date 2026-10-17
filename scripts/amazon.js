import { cart, addToCart } from '../data/cart.js';
import { notifyError } from '../data/backend.js';
import { products,loadProducts } from '../data/products.js';
import { formatcurrency } from './uitils/money.js';
import { setupAccountMenu } from './account.js';
import { escapeHTML, safeImagePath } from './uitils/sanitize.js';

setupAccountMenu();
const pageSize = 12;
let currentPage = Number(new URLSearchParams(window.location.search).get('page')) || 1;
const categoryFilter = document.querySelector('.category-filter');
const sortSelect = document.querySelector('.sort-select');

function getSearchValue() {
  const searchInput = document.querySelector('.search-bar');
  return searchInput ? searchInput.value.trim().toLowerCase() : '';
}

function getCategory(product) {
  const departments = ['women', 'kemis', 'men', 'kids', 'weddings', 'accessories', 'netela', 'apparel', 'kitchen', 'home', 'bathroom', 'appliances', 'footwear', 'jewelry', 'sports'];
  return departments.find((department) => product.keywords?.includes(department) || product.name.toLowerCase().includes(department)) || product.type || 'Other';
}

function updateURL() {
  const params = new URLSearchParams();
  const search = getSearchValue();
  if (search) params.set('q', search);
  if (categoryFilter.value !== 'all') params.set('category', categoryFilter.value);
  if (sortSelect.value !== 'featured') params.set('sort', sortSelect.value);
  if (currentPage > 1) params.set('page', String(currentPage));
  const query = params.toString();
  history.replaceState(null, '', query ? `amazon.html?${query}` : 'amazon.html');
}

function populateCategories() {
  const culturalCategories = [
    { value: 'all', label: 'All Collections' },
    { value: 'women', label: "Women's Kemis" },
    { value: 'men', label: "Men's Cultural" },
    { value: 'kids', label: 'Kids & Family' },
    { value: 'weddings', label: 'Weddings & Melse' },
    { value: 'accessories', label: 'Netela & Gabi' }
  ];

  categoryFilter.innerHTML = '';
  culturalCategories.forEach((cat) => {
    categoryFilter.insertAdjacentHTML('beforeend', `<option value="${escapeHTML(cat.value)}">${escapeHTML(cat.label)}</option>`);
  });

  const productCategories = [...new Set(products.map(getCategory))].sort();
  productCategories.forEach((category) => {
    if (!culturalCategories.some((cat) => cat.value === category)) {
      categoryFilter.insertAdjacentHTML('beforeend', `<option value="${escapeHTML(category)}">${escapeHTML(category)}</option>`);
    }
  });

  const params = new URLSearchParams(window.location.search);
  categoryFilter.value = params.get('category') || 'all';
  sortSelect.value = params.get('sort') || 'featured';
  const searchInput = document.querySelector('.search-bar');
  if (searchInput) searchInput.value = params.get('q') || '';
}

function getVisibleProducts() {
  const searchTerm = getSearchValue();
  const category = categoryFilter.value;
  const filtered = products.filter((product) => {
    const haystack = [product.name, product.category, ...(product.keywords || []), product.type]
      .filter(Boolean).join(' ').toLowerCase();

    let matchesCategory = (category === 'all');
    if (!matchesCategory) {
      if (category === 'women' || category === 'kemis') {
        matchesCategory = haystack.includes('women') || haystack.includes('kemis') || haystack.includes('dress') || getCategory(product) === 'women' || getCategory(product) === 'apparel';
      } else if (category === 'men') {
        matchesCategory = haystack.includes('men') || haystack.includes('kidan') || getCategory(product) === 'men';
      } else if (category === 'kids') {
        matchesCategory = haystack.includes('kid') || haystack.includes('child') || haystack.includes('family') || getCategory(product) === 'kids';
      } else if (category === 'weddings') {
        matchesCategory = haystack.includes('wedding') || haystack.includes('melse') || haystack.includes('kaba') || (product.rating && product.rating.stars >= 4.5);
      } else if (category === 'accessories' || category === 'netela') {
        matchesCategory = haystack.includes('accessories') || haystack.includes('netela') || haystack.includes('gabi') || haystack.includes('sunglasses') || getCategory(product) === 'accessories';
      } else {
        matchesCategory = getCategory(product) === category || haystack.includes(category);
      }
    }

    return (!searchTerm || haystack.includes(searchTerm)) && matchesCategory;
  });
  return filtered.sort((first, second) => {
    if (sortSelect.value === 'price-low') return first.priceCents - second.priceCents;
    if (sortSelect.value === 'price-high') return second.priceCents - first.priceCents;
    if (sortSelect.value === 'rating') return second.rating.stars - first.rating.stars || second.rating.count - first.rating.count;
    if (sortSelect.value === 'newest') return products.indexOf(second) - products.indexOf(first);
    return 0;
  });
}

function renderProductsGrid() {
  const allVisibleProducts = getVisibleProducts();
  const pageCount = Math.max(1, Math.ceil(allVisibleProducts.length / pageSize));
  currentPage = Math.min(Math.max(currentPage, 1), pageCount);
  const visibleProducts = allVisibleProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  updateURL();
  document.querySelector('.results-count').textContent = `${allVisibleProducts.length} product${allVisibleProducts.length === 1 ? '' : 's'}`;

  let productHTML = '';

  if (visibleProducts.length === 0) {
    productHTML = `
      <div class="no-results">
        No products match your search. Try a different keyword.
      </div>
    `;
  } else {
    visibleProducts.forEach((product) => {
      productHTML += `
        <article class="product-container">
          <div class="product-image-container">
            <a href="product.html?id=${encodeURIComponent(product.id)}"><img class="product-image" src="${safeImagePath(product.image)}" alt="${escapeHTML(product.name)}"></a>
          </div>

          <a class="product-name limit-text-to-2-lines product-link" href="product.html?id=${encodeURIComponent(product.id)}">${escapeHTML(product.name)}</a>

          <div class="product-rating-container">
            <img class="product-rating-stars" src="${product.getstarsUrl()}" alt="${product.rating.stars} out of 5 stars">
            <div class="product-rating-count">${product.rating.count}</div>
          </div>

          <div class="product-price">${product.getprice()}</div>

          <div class="product-stock">${product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</div>

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

          ${product.sizeChartLink ? `<a href="${safeImagePath(product.sizeChartLink)}" class="size-chart" target="_blank" rel="noreferrer">Size Chart</a>` : ''}

          <div class="product-spacer"></div>

          <div class="added-to-cart">
            <img src="images/icons/checkmark.png" alt="Added">
            Added
          </div>

          <button class="add-to-cart-button button-primary js-rell" data-product-id="${product.id}">
            Add to Cart
          </button>
        </article>`;
    });
  }

  const productGrid = document.querySelector('.js-product-grid');
  if (productGrid) {
    productGrid.innerHTML = productHTML;
  }
  const pagination = document.querySelector('.pagination');
  pagination.innerHTML = pageCount > 1 ? Array.from({ length: pageCount }, (_, index) => `<button class="page-button${index + 1 === currentPage ? ' active' : ''}" data-page="${index + 1}" aria-label="Page ${index + 1}">${index + 1}</button>`).join('') : '';
  pagination.querySelectorAll('.page-button').forEach((button) => button.addEventListener('click', () => { currentPage = Number(button.dataset.page); renderProductsGrid(); window.scrollTo({ top: 0, behavior: 'smooth' }); }));

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
  searchInput.addEventListener('input', () => { currentPage = 1; renderProductsGrid(); });
  searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      currentPage = 1; renderProductsGrid();
    }
  });
}

if (searchButton) {
  searchButton.addEventListener('click', () => {
    currentPage = 1; renderProductsGrid();
  });
}

categoryFilter.addEventListener('change', () => { currentPage = 1; renderProductsGrid(); });
sortSelect.addEventListener('change', () => { currentPage = 1; renderProductsGrid(); });

function setupSubnavInteractions() {
  document.querySelectorAll('.js-subnav-link').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (link.dataset.action === 'home') {
        event.preventDefault();
        if (categoryFilter) categoryFilter.value = 'all';
        if (sortSelect) sortSelect.value = 'featured';
        if (searchInput) searchInput.value = '';
        currentPage = 1;
        renderProductsGrid();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const category = link.dataset.category;
      const sort = link.dataset.sort;

      if (category !== undefined && categoryFilter) {
        event.preventDefault();
        categoryFilter.value = category;
        if (sortSelect) sortSelect.value = sort || 'featured';
        currentPage = 1;
        renderProductsGrid();
        const shopSection = document.getElementById('shop');
        if (shopSection) {
          shopSection.scrollIntoView({ behavior: 'smooth' });
        }
      } else if (sort !== undefined && sortSelect) {
        event.preventDefault();
        sortSelect.value = sort;
        currentPage = 1;
        renderProductsGrid();
        const shopSection = document.getElementById('shop');
        if (shopSection) {
          shopSection.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });
}

loadProducts(() => {
  populateCategories();
  renderProductsGrid();
  setupSubnavInteractions();
});
/*
this is a start of a great legacy that i will build in my life time this will be a note tha i promise my self to be the gratest software engineer that has passed through this life 
i have started a journey that will end in death */
