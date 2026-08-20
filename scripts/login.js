import { getLoginDestination } from './login-routing.js';

const API_URL = 'http://localhost:8000';
const form = document.querySelector('#login-form');
const message = document.querySelector('#message');
const signInButton = document.querySelector('#sign-in-button');

function goToAccountPage(user) {
  window.location.assign(getLoginDestination(user));
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.textContent = '';
  signInButton.disabled = true;
  signInButton.textContent = 'Checking...';
  const formData = new FormData(form);
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: formData.get('username'), password: formData.get('password') })
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Sign in failed.');
    localStorage.setItem('topazionToken', payload.token);
    localStorage.setItem('topazionUser', JSON.stringify(payload.user));
    try {
      const cartResponse = await fetch(`${API_URL}/me/cart`, {
        headers: { Authorization: `Bearer ${payload.token}` }
      });
      const serverCart = await cartResponse.json();
      if (!cartResponse.ok) throw new Error(serverCart.error || 'Could not load your cart.');
      localStorage.setItem('cart', JSON.stringify(serverCart.items));
    } catch (cartError) {
      console.error('Could not restore the saved cart.', cartError);
      localStorage.setItem('cart', JSON.stringify([]));
    }
    goToAccountPage(payload.user);
  } catch (error) {
    message.textContent = `Sign in failed: ${error.message}`;
    signInButton.disabled = false;
    signInButton.textContent = 'Sign in';
  }
});
