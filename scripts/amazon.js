import { cart, addToCart } from '../data/cart.js';
import { products } from '../data/products.js';
import { formatcurrency } from './uitils/money.js';


let productHTML = '';

products.forEach((product) => {
  productHTML +=


    `<div class="product-container">
          <div class="product-image-container">
            <img class="product-image"
              src="${product.image}">
          </div>

          <div class="product-name limit-text-to-2-lines">
          ${product.name}
          </div>

          <div class="product-rating-container">
            <img class="product-rating-stars"
              src="${product.getstarsUrl()}">
            <div class="product-rating-count link-primary">
            ${product.rating.count}
            </div>
          </div>

          <div class="product-price"> ${product.getprice()}</div>

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
            <img src="images/icons/checkmark.png">
            Added
          </div>

          <button class="add-to-cart-button button-primary js-rell"
          data-product-id="${product.id}">
            Add to Cart
          </button>
        </div>`;

})
document.querySelector('.js-product-grid').innerHTML = productHTML;

function updateCartQuantity() {
  let cartQuantity = 0;

  cart.forEach((cartItem) => {
    cartQuantity += cartItem.quantity;
  })

  document.querySelector('.js-cart-quantity')
    .innerHTML = cartQuantity;

}
document.querySelectorAll('.js-rell')
  .forEach((button) => {
    button.addEventListener('click', () => {
      const productId = button.dataset.productId;
      addToCart(productId);

      updateCartQuantity();

    })
  }
  )
document.querySelector('.js-cart-quantity2').innerHTML = cart.length;

updateCartQuantity();
