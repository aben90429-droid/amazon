import { backendUrl } from '../data/backend.js';

const API_URL = backendUrl;
const token = localStorage.getItem('topazionToken');
const user = JSON.parse(localStorage.getItem('topazionUser') || 'null');
const message = document.querySelector('#message');

if (!token || !user || user.role !== 'owner') {
  window.location.href = 'login.html';
  throw new Error('Owner access is required.');
}

document.querySelector('#logout-button').addEventListener('click', async () => {
  try {
    await fetch(`${API_URL}/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
  } catch (error) {
    message.textContent = error.message;
  } finally {
    localStorage.removeItem('topazionToken');
    localStorage.removeItem('topazionUser');
    localStorage.removeItem('cart');
    window.location.href = 'amazon.html';
  }
});
