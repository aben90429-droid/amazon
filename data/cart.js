export let cart;

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

function savetostorage() {
  localStorage.setItem('cart', JSON.stringify(cart));
}


export function addToCart(productId) {
  let matchitem;

  cart.forEach((item) => {
    if (item.productId === productId) {
      matchitem = item;
    }
  });

  if (matchitem) {
    matchitem.quantity += 1;
  } else {

    cart.push({
      productId: productId,
      quantity: 1,
      deliveryoptions: '1'
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

