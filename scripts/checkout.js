import { renderOrderSummary } from './checkout/ordersummary.js';
import { cart } from '../data/cart.js';
import { renderPaymatsummery } from './checkout/paymatsummery.js';
//import '../data/cart-class.js';
import {xhr} from '../data/backend.js';
import {loadProducts} from '../data/products.js';

loadProducts(() => {
renderOrderSummary();
renderPaymatsummery();
});
