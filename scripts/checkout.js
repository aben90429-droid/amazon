import { renderOrderSummary } from './checkout/ordersummary.js';
import { cart } from '../data/cart.js';
import { renderPaymatsummery } from './checkout/paymatsummery.js';
//import '../data/cart-class.js';
import {xhr} from '../data/backend.js';
renderOrderSummary();
renderPaymatsummery();

document.querySelector('.js-return-to-home-link').innerHTML = `${cart.length} items`;
