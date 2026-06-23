import { cart, removefromcart, setQuantity, updatedeliveryoptions } from '../../data/cart.js';
import { products, getproduct } from '../../data/products.js';
import { formatcurrency } from '../uitils/money.js';
import dayjs from 'https://unpkg.com/supersimpledev@8.5.0/dayjs/esm/index.js';
import { deliveryoptions, getdeliveryoption } from '../../data/delivery.js';
import { renderPaymatsummery } from './paymatsummery.js';
const today = dayjs();

function deliveryoptionsHTML(matchingproduct, cartItem) {
  let HTML = '';

  deliveryoptions.sort((a, b) => a.deliveryDate - b.deliveryDate);

  deliveryoptions.forEach((deliveryoption) => {
    const today = dayjs();
    const deliveryDate = today.add(deliveryoption.deliveryDate, 'day');
    const dateString = deliveryDate.format('dddd, MMMM D');

    const pricestring = deliveryoption.pricecents === 0 ? 'FREE' : `$${formatcurrency(deliveryoption.pricecents)} -`;
    const isSelected = cartItem.deliveryOptionId === deliveryoption.id ? 'checked' : '';

    HTML +=
      `
          <div class="delivery-option js-delivery-option"
          data-product-id="${matchingproduct.id}"
          data-delivery-option-id="${deliveryoption.id}">
                  <input type="radio"
                  ${isSelected ? 'checked' : ''}
                    class="delivery-option-input"
                    name="delivery-option-${matchingproduct.id}">
                  <div>
                    <div class="delivery-option-date">
                      ${dateString}
                    </div>
                    <div class="delivery-option-price">
                ${pricestring} Shipping
                    </div>
                  </div>
                </div>`
  })
  return HTML;
}

export function renderOrderSummary() {
  let cartsummaryHTML = '';

  cart.forEach((cartItem) => {
    const productId = cartItem.productId;

    const matchingproduct = getproduct(productId);

    const deliveryOptionId = cartItem.deliveryOptionId;

    let deliveryOption = getdeliveryoption(deliveryOptionId);

    if (!deliveryOption) {
      deliveryOption = deliveryoptions[0];
    }

    const deliveryDate = today.add(deliveryOption.deliveryDate, 'day');
    const dateString = deliveryDate.format('dddd, MMMM D');

    cartsummaryHTML +=
      `
       <div class="cart-item-container
       js-cart-item-container${matchingproduct.id}">
                <div class="delivery-date">
                  Delivery date: ${dateString}
                </div>

                <div class="cart-item-details-grid">
                  <img class="product-image"
                    src="${matchingproduct.image}">

                  <div class="cart-item-details">
                    <div class="product-name">
                     ${matchingproduct.name}
                    </div>
                    <div class="product-price">
                      ${matchingproduct.getprice()}
                    </div>
                    <div class="product-quantity">
                      <span>
                        Quantity: <span class="quantity-label">${cartItem.quantity}</span>
                      </span>
                      <span class="update-quantity-link link-primary js-update-link" data-product-id="${matchingproduct.id}">
                        Update
                      </span>
                      <span class="delete-quantity-link link-primary js-delete-link" data-product-id="${matchingproduct.id}">
                        Delete
                      </span>
                    </div>
                  </div>

                  <div class="delivery-options">
                    <div class="delivery-options-title">
                      Choose a delivery option:

                    </div>
                    ${deliveryoptionsHTML(matchingproduct, cartItem)}
                  </div>
                </div>
              </div>`
  });

  const orderSummaryElement = document.querySelector('.js-order-summary');
  if (orderSummaryElement) {
    orderSummaryElement.innerHTML = cartsummaryHTML;
  } else {
    console.warn('Order summary container not found: .js-order-summary');
  }

  // Event listeners
  document.querySelectorAll('.js-delete-link').forEach((deleteLink) => {
    deleteLink.addEventListener('click', () => {
      const productId = deleteLink.dataset.productId;
      removefromcart(productId);
      console.log(cart);

      const cartItemContainer = document.querySelector(`.js-cart-item-container${productId}`);
      cartItemContainer.remove();

      renderPaymatsummery();

    });
  });

  document.querySelectorAll('.js-update-link').forEach((updateLink) => {
    updateLink.addEventListener('click', () => {
      const productId = updateLink.dataset.productId;
      const quantityLabel = updateLink.parentElement.querySelector('.quantity-label');

      let newQuantity;
      do {
        const input = prompt('Enter new quantity:');
        if (input === null) return; // user cancelled

        newQuantity = Number(input);
        if (!Number.isInteger(newQuantity) || newQuantity < 1 || newQuantity > 100) {
          alert('Please enter a whole number greater than 0 to 100.');
        }
      } while (!Number.isInteger(newQuantity) || newQuantity < 1 || newQuantity > 100);

      setQuantity(productId, newQuantity);
      quantityLabel.textContent = newQuantity;
    });
  });

  document.querySelectorAll('.js-delivery-option').forEach((option) => {
    option.addEventListener('click', () => {
      const { productId, deliveryOptionId } = option.dataset;

      // Update the saved delivery option in cart data
      updatedeliveryoptions(productId, deliveryOptionId);

      // Update the UI to reflect the newly selected delivery option
      const selectedDate = option.querySelector('.delivery-option-date')?.textContent;
      const cartItemContainer = document.querySelector(`.js-cart-item-container${productId}`);
      if (cartItemContainer && selectedDate) {
        const deliveryDateLabel = cartItemContainer.querySelector('.delivery-date');
        if (deliveryDateLabel) {
          deliveryDateLabel.textContent = `Delivery date: ${selectedDate}`;
        }
      }

      // Ensure only the clicked option is checked
      option.querySelector('input[type="radio"]')?.setAttribute('checked', '');
      option
        .closest('.delivery-options')
        ?.querySelectorAll('.delivery-option input[type="radio"]')
        .forEach((input) => {
          if (input !== option.querySelector('input[type="radio"]')) {
            input.removeAttribute('checked');
          }
        });
      renderPaymatsummery()
    });
  });
}/*remambert to copy the test in 17.32.238*/