export let cart;
let productIds;
let productStock = new Map();

function notifyCartError(message) {
  console.error(message);
  window.alert(`Topazion error: ${message}`);
}

loadFromStorage();

export function loadFromStorage() {
  cart = JSON.parse(localStorage.getItem('cart'))

  if (!cart) {
    cart = [{
      productId:
        "e43638ce-6aa0-4b85-b27f-e1d07eb678c6",
      quantity: 2,
      deliveryOptionId: '1'
    }, {
      productId:
        "15b6fc6f-327a-4ec4-896f-486349e85a3d"
      , quantity: 1,
      deliveryOptionId: '2'
    }];
  } else {
    // Migrate old property name
    cart.forEach((item) => {
      if (item.deliveryoptions && !item.deliveryOptionId) {
        item.deliveryOptionId = item.deliveryoptions;
        delete item.deliveryoptions;
      }
    });
  }
}

function savetostorage(shouldSync = true) {
  localStorage.setItem('cart', JSON.stringify(cart));
  if (shouldSync) {
    syncUserCart();
  }
}

function syncUserCart() {
  const token = localStorage.getItem('topazionToken');
  if (!token) return;
  fetch('http://localhost:8000/me/cart', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ items: cart })
  }).then(async (response) => {
    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.error || `Could not save your cart (${response.status}).`);
    }
  }).catch((error) => notifyCartError(error.message));
}

export function setProductCatalog(products) {
  productIds = new Set(products.map((product) => product.id));
  productStock = new Map(products.map((product) => [product.id, product.stock]));
  cart = cart.filter((item) => productIds.has(item.productId));
  savetostorage(false);
}

function validateQuantity(quantity) {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error('Quantity must be a whole number greater than zero.');
  }
}

export function addToCart(productId, quantityToAdd = 1) {
  if (productIds && !productIds.has(productId)) {
    throw new Error('That product does not exist in the catalog.');
  }
  validateQuantity(quantityToAdd);
  let matchitem;

  cart.forEach((item) => {
    if (item.productId === productId) {
      matchitem = item;
    }
  });

  if (matchitem) {
    const requestedQuantity = matchitem.quantity + quantityToAdd;
    if (productStock.has(productId) && requestedQuantity > productStock.get(productId)) {
      throw new Error(`Only ${productStock.get(productId)} unit(s) of this product are available.`);
    }
    matchitem.quantity += quantityToAdd;
  } else {
    if (productStock.has(productId) && quantityToAdd > productStock.get(productId)) {
      throw new Error(`Only ${productStock.get(productId)} unit(s) of this product are available.`);
    }

    cart.push({
      productId: productId,
      quantity: quantityToAdd,
      deliveryOptionId: '1'
    });
  };

  savetostorage();
}
export function removefromcart(productId) {
  const newcart = [];

  cart.forEach((cartItem) => {

    if (cartItem.productId !== productId) {
      newcart.push(cartItem);
    }

  })
  cart = newcart;
  savetostorage();
}

export function setQuantity(productId, quantity) {
  const cartItem = cart.find((item) => item.productId === productId);
  if (!cartItem) return;

  // Only accept whole numbers greater than 0.
  if (!Number.isInteger(quantity) || quantity < 1) {
    // If the user enters 0 or invalid value, remove the item from the cart.
    removefromcart(productId);
    return;
  }
  if (productStock.has(productId) && quantity > productStock.get(productId)) {
    notifyCartError(`Only ${productStock.get(productId)} unit(s) of this product are available.`);
    return;
  }

  cartItem.quantity = quantity;
  savetostorage();
}

export function updatedeliveryoptions(productId, deliveryOptionId) {
  cart.forEach((cartItem) => {
    if (cartItem.productId === productId) {
      cartItem.deliveryOptionId = deliveryOptionId;
    }
  });
  savetostorage();
}

export function loadCart(fun) {
  const xhr = new XMLHttpRequest();

  xhr.addEventListener('load', () => {
    if (xhr.status < 200 || xhr.status >= 300) {
      notifyCartError(`Cart request failed (${xhr.status}).`);
      return;
    }
    fun();
  });
  xhr.addEventListener('error', () => {
    notifyCartError('Could not connect to the Topazion backend.');
  });
  xhr.open('GET', 'http://localhost:8000/cart');
  xhr.send();
}