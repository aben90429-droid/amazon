import { cart, clearCart } from "../../data/cart.js";
import { getproduct, products } from "../../data/products.js";
import { getdeliveryoption } from "../../data/delivery.js";
import { formatcurrency } from "../uitils/money.js";
import { notifyError } from "../../data/backend.js";
import { backendUrl } from "../../data/backend.js";
export function renderPaymatsummery() {
  const summaryElement = document.querySelector('.js-payment-summary');
  if (!summaryElement) return;

  if (cart.length === 0) {
    summaryElement.innerHTML = `
      <div class="payment-summary-title">No items to order</div>
      <p>Add a product to your cart before placing an order.</p>`;
    return;
  }

  let productpriceCents = 0;
  let shippingpriceCents = 0;

  cart.forEach((cartItem) => {
    const product = getproduct(cartItem.productId);
    if (!product) return;
    productpriceCents += product.priceCents * cartItem.quantity;

    const deliveryOption = getdeliveryoption(cartItem.deliveryOptionId);
    shippingpriceCents += deliveryOption.pricecents * cartItem.quantity;
  });

  const totalbeforetaxCents = productpriceCents + shippingpriceCents;
  const taxscents = totalbeforetaxCents * 0.1;
  const totalcents = totalbeforetaxCents + taxscents;


  const paymentSumaryHTMl = `
  <div class="payment-summary-title">
          Order Summary
        </div>

        <div class="payment-summary-row">
          <div>item(3):</div>
          <div class="payment-summary-money">$${formatcurrency(productpriceCents)}
          </div>
        </div>

        <div class="payment-summary-row">
          <div>Shipping &amp; handling:</div>
          <div class="payment-summary-money">$${formatcurrency(shippingpriceCents)}</div>
        </div>

        <div class="payment-summary-row subtotal-row">
          <div>Total before tax:</div>
          <div class="payment-summary-money">$${formatcurrency(totalbeforetaxCents)}</div>
        </div>

        <div class="payment-summary-row">
          <div>Estimated tax (10%):</div>
          <div class="payment-summary-money">$${formatcurrency(taxscents)}</div>
        </div>

        <div class="payment-summary-row total-row">
          <div>Order total:</div>
          <div class="payment-summary-money">$${formatcurrency(totalcents)}</div>
        </div>

        <button class="place-order-button button-primary js-place-order">
          Place your order
        </button>
  `


  summaryElement.innerHTML = paymentSumaryHTMl;

  document.querySelector('.js-place-order').addEventListener('click', async () => {
    const placeOrderButton = document.querySelector('.js-place-order');
    placeOrderButton.disabled = true;
    placeOrderButton.textContent = 'Placing order...';
    try{
      const orderCart = cart.map((cartItem) => ({ ...cartItem }));
      const response = await fetch(`${backendUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('topazionToken')}`
      },
  body: JSON.stringify({
    cart: orderCart
  })
});

if (!response.ok) {
  const failure = await response.json();
  throw new Error(failure.error || `Order failed (${response.status}).`);
}
const order = await response.json();
clearCart();
window.location.href = 'orders.html';

    }
    catch(error){
      notifyError(error);
      placeOrderButton.disabled = false;
      placeOrderButton.textContent = 'Place your order';
    }
  })
}