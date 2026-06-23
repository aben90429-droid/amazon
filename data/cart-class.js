class Cart {
  cartItemss;

  #localStorageKey;

  constructor(localStorageKey) {

    this.#localStorageKey = localStorageKey;
    this.#loadFromStorage();
    ;

  }

  #loadFromStorage() {
    this.cartItemss = JSON.parse(localStorage.getItem(this.#localStorageKey))

    if (!this.cartItemss) {
      this.cartItemss = [{
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
      this.cartItemss.forEach((item) => {
        if (item.deliveryoptions && !item.deliveryOptionId) {
          item.deliveryOptionId = item.deliveryoptions;
          delete item.deliveryoptions;
        }
      });
    }
  }

  savetostorage() {
    localStorage.setItem(this.#localStorageKey, JSON.stringify(this.cartItemss));
  }



  addToCart(productId) {
    let matchitem;

    this.cartItemss.forEach((item) => {
      if (item.productId === productId) {
        matchitem = item;
      }
    });

    if (matchitem) {
      matchitem.quantity += 1;
    } else {

      this.cartItemss.push({
        productId: productId,
        quantity: 1,
        deliveryoptions: '1'
      });
    };

    this.savetostorage();
  }

  removefromcart(productId) {
    const newcart = [];

    this.cartItemss.forEach((cartItem) => {

      if (cartItem.productId !== productId) {
        newcart.push(cartItem);
      }

    })
    this.cartItemss = newcart;
    this.savetostorage();
  }
  updatedeliveryoptions(productId, deliveryOptionId) {
    this.cartItemss.forEach((cartItem) => {
      if (cartItem.productId === productId) {
        cartItem.deliveryOptionId = deliveryOptionId;
      }
    });
    this.savetostorage();
  }
}



const cart = new Cart('cart-oop');
const businessCart = new Cart('business-cart');
const anotherCart = new Cart('another-cart');





console.log(cart);
console.log(businessCart);
console.log(anotherCart);


console.log(businessCart instanceof cart.constructor);













export function setQuantity(productId, quantity) {
  const cartItem = cart.cartItemss.find((item) => item.productId === productId);
  if (!cartItem) return;

  // Only accept whole numbers greater than 0.
  if (!Number.isInteger(quantity) || quantity < 1) {
    // If the user enters 0 or invalid value, remove the item from the cart.
    cart.removefromcart(productId);
    return;
  }

  cartItem.quantity = quantity;
  cart.savetostorage();
}



