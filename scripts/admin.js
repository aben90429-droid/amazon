const API_URL = 'http://localhost:8000';
const form = document.querySelector('#product-form');
const productList = document.querySelector('#product-list');
const statusElement = document.querySelector('#status');

function showStatus(message, isError = false) {
  statusElement.textContent = message;
  statusElement.className = `status${isError ? ' error' : ''}`;
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers }
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
    <tr data-product-id="${product.id}">
      <td><strong>${product.name}</strong><small>${product.id}</small></td>
      <td>$${(product.priceCents / 100).toFixed(2)}</td>
      <td><input class="stock-input" type="number" min="0" value="${product.stock}" aria-label="Stock for ${product.name}"></td>
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

document.querySelector('#refresh-button').addEventListener('click', loadProducts);
loadProducts();
