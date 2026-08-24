import { renderOrderSummary } from './checkout/ordersummary.js';
import { renderPaymatsummery } from './checkout/paymatsummery.js';
import { loadProductsfetch } from '../data/products.js';
import { notifyError } from '../data/backend.js';

async function loadPage() {
  if (!localStorage.getItem('topazionToken')) {
    window.location.href = 'login.html';
    return;
  }

  try {
    await loadProductsfetch();
    renderOrderSummary();
    renderPaymatsummery();
  } catch (error) {
    notifyError(error);
   }
}

loadPage();
