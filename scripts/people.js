import { backendUrl } from '../data/backend.js';

const API_URL = backendUrl;
const token = localStorage.getItem('topazionToken');
const signedInUser = JSON.parse(localStorage.getItem('topazionUser') || 'null');
const peopleList = document.querySelector('#people-list');
const message = document.querySelector('#message');
const currentUser = document.querySelector('#current-user');

if (!token || !signedInUser || signedInUser.role !== 'owner') {
  window.location.href = 'login.html';
} else {
  loadPeople();
}

function showError(error) {
  message.textContent = error.message;
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...options.headers }
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status}).`);
  return payload;
}

function renderPeople(people) {
  peopleList.innerHTML = people.map((person) => `
    <article class="person-card">
      <div class="person-topline"><div><h2>${person.displayName}</h2><p>@${person.username}</p></div><span class="online ${person.isOnline ? 'active' : ''}">${person.isOnline ? 'Online' : 'Offline'}</span></div>
      <div class="cart-heading"><strong>Personal cart</strong><span>${person.cart.length} item type(s)</span></div>
      ${person.cart.length ? `<ul>${person.cart.map((item) => `<li><span>${item.productId}</span><strong>Qty ${item.quantity}</strong></li>`).join('')}</ul>` : '<p class="empty">Cart is empty.</p>'}
    </article>`).join('');
}

async function loadPeople() {
  try {
    const user = await apiRequest('/auth/me');
    currentUser.textContent = `Signed in as ${user.displayName}`;
    renderPeople(await apiRequest('/admin/people'));
  } catch (error) {
    if (error.message.includes('sign-in') || error.message.includes('session')) {
      localStorage.removeItem('topazionToken');
      localStorage.removeItem('topazionUser');
      window.location.href = 'login.html';
      return;
    }
    showError(error);
  }
}

document.querySelector('#logout-button').addEventListener('click', async () => {
  try { await apiRequest('/auth/logout', { method: 'POST' }); } catch (error) { showError(error); }
  localStorage.removeItem('topazionToken');
  localStorage.removeItem('topazionUser');
  window.location.href = 'login.html';
});

