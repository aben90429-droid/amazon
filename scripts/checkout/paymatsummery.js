import { cart } from "../../data/cart.js";
import { getproduct, products } from "../../data/products.js";
import { getdeliveryoption } from "../../data/delivery.js";
import { formatcurrency } from "../uitils/money.js  ";
export function renderPaymatsummery() {
  let productpriceCents = 0;
  let shippingpriceCents = 0;

  cart.forEach((cartItem) => {
    const product = getproduct(cartItem.productId);
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

        <button class="place-order-button button-primary">
          Place your order
        </button>
  `


  document.querySelector('.js-payment-summary').innerHTML = paymentSumaryHTMl;
}
